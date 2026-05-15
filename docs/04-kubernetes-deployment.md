# 04 — Kubernetes Deployment

> How to run HudumaCare on Kubernetes so it stays up when traffic spikes and
> you can ship without ceremony. Optimized for a small team — use managed
> services wherever possible.

## Cluster shape

| Where | What |
| --- | --- |
| **Cluster** | One GKE / EKS / DigitalOcean cluster, 3 zones, in a region close to Nairobi (Frankfurt or Johannesburg is currently the best DC-latency trade-off; revisit when AWS Cape Town latency improves). |
| **Node pools** | `system` (2 small nodes, taints for kube-system) + `app` (autoscaling 2 → 20 medium nodes) + optionally `worker` (autoscaling 0 → 10, for spiky Temporal load). |
| **Ingress** | NGINX ingress controller + cert-manager for Let's Encrypt. Cloudflare in front for DDoS + CDN. |
| **Secrets** | External Secrets Operator pulling from Doppler / 1Password / GCP Secret Manager. **Never** check secrets into manifests. |
| **Observability** | Prometheus + Grafana + Loki (or Grafana Cloud's managed tier — easier for small teams). |
| **Errors** | Sentry. One project per app. |

## Namespaces

```
huduma-prod/        # all prod workloads
huduma-staging/     # staging
huduma-system/      # ingress, cert-manager, monitoring
huduma-temporal/    # self-hosted Temporal (skip if using Temporal Cloud)
```

## Manifests — the shape

Use **Helm** with one chart per app + a parent umbrella chart. Or Kustomize
if your team prefers. The skeleton:

```
infra/k8s/
├── charts/
│   ├── web/
│   │   ├── templates/{deployment,service,hpa,ingress,configmap}.yaml
│   │   └── values.yaml
│   ├── api/
│   ├── worker/
│   └── webhook/
├── envs/
│   ├── prod/values.yaml
│   └── staging/values.yaml
└── platform/         # shared: ingress-nginx, cert-manager, external-secrets, kube-prometheus-stack
```

### `web` Deployment (essentials)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: huduma-prod
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: web
          image: ghcr.io/your-org/huduma-web:{{ .Values.imageTag }}
          ports: [{ containerPort: 3000 }]
          envFrom:
            - secretRef: { name: web-env }
            - configMapRef: { name: web-config }
          resources:
            requests: { cpu: 200m, memory: 256Mi }
            limits:   { cpu: 1000m, memory: 1Gi }
          readinessProbe:
            httpGet: { path: /api/health, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /api/health, port: 3000 }
            initialDelaySeconds: 30
            periodSeconds: 30
          lifecycle:
            preStop: { exec: { command: ["sleep", "10"] } }   # drain in-flight requests
```

Every app gets a `/api/health` endpoint that returns 200 only when its
dependencies (DB, Redis) are reachable. Without that, rollouts are blind.

### HPA — three different scaling signals

```yaml
# web — scales on CPU + request concurrency
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: web }
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
    - type: Pods
      pods:
        metric: { name: nginx_active_connections }    # via prometheus-adapter
        target: { type: AverageValue, averageValue: "30" }
```

For `worker`, scale on **Temporal task queue depth** using KEDA:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata: { name: worker, namespace: huduma-prod }
spec:
  scaleTargetRef: { name: worker }
  minReplicaCount: 2
  maxReplicaCount: 50
  triggers:
    - type: temporal
      metadata:
        endpoint: temporal-frontend.huduma-temporal:7233
        namespace: default
        taskQueue: huduma-main
        targetQueueSize: "10"
```

CPU-scaling a Temporal worker pool is wrong: a worker waiting on a
30-minute booking-response signal uses no CPU but is doing critical work.

### Ingress

One Ingress, host-based routing:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: huduma
  namespace: huduma-prod
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/limit-rps: "60"
spec:
  tls:
    - hosts: [huduma.care, admin.huduma.care, api.huduma.care]
      secretName: huduma-tls
  rules:
    - host: huduma.care
      http:
        paths:
          - { path: /api/, pathType: Prefix, backend: { service: { name: api, port: { number: 80 } } } }
          - { path: /webhooks/, pathType: Prefix, backend: { service: { name: webhook, port: { number: 80 } } } }
          - { path: /, pathType: Prefix, backend: { service: { name: web, port: { number: 80 } } } }
    - host: admin.huduma.care
      http:
        paths:
          - { path: /, pathType: Prefix, backend: { service: { name: web, port: { number: 80 } } } }
```

### PodDisruptionBudgets

Every Deployment with `replicas >= 2` gets one:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: web }
spec:
  minAvailable: 50%
  selector: { matchLabels: { app: web } }
```

Without PDBs, a node upgrade can take you to zero replicas mid-roll.

### NetworkPolicies

Default-deny ingress in the namespace, then allow:
- ingress-nginx → `web`, `api`, `webhook` on app ports
- `web` → `api` (intra-cluster)
- `api` → Temporal frontend, Postgres, Redis
- `worker` → Temporal frontend, Postgres, Redis, outbound HTTPS

This is one of those things you'll regret skipping the first time a compromised dependency tries to phone home.

## Secrets

Use **External Secrets Operator**:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata: { name: api-env, namespace: huduma-prod }
spec:
  secretStoreRef: { name: doppler, kind: ClusterSecretStore }
  target: { name: api-env }
  data:
    - { secretKey: SUPABASE_SERVICE_KEY, remoteRef: { key: SUPABASE_SERVICE_KEY } }
    - { secretKey: TEMPORAL_API_KEY,     remoteRef: { key: TEMPORAL_API_KEY } }
    - { secretKey: AT_API_KEY,           remoteRef: { key: AT_API_KEY } }     # Africa's Talking
    - { secretKey: MPESA_CONSUMER_KEY,   remoteRef: { key: MPESA_CONSUMER_KEY } }
    - { secretKey: SENTRY_DSN,           remoteRef: { key: SENTRY_DSN } }
```

The `Secret` is created in-cluster; only ESO has read access to the source.

## Temporal — Cloud or self-hosted?

**Use Temporal Cloud for v1.** Reasons:
- Running Temporal on K8s is non-trivial (Cassandra/Elasticsearch).
- The cost is reasonable until you're at hundreds of thousands of workflow starts per day.
- If costs become a problem you can migrate; namespace export is straightforward.

If you self-host, use the official Helm chart in `huduma-temporal`. Plan
for: Cassandra (or PostgreSQL persistence — fine up to ~50 actions/sec),
Elasticsearch for visibility, a Web UI behind your VPN.

## CI / CD

**Build:** GitHub Actions → build images → push to GHCR.
**Deploy:** Argo CD watches `infra/k8s/envs/prod` and reconciles. Image tag
bumps via a small PR-to-merge bot (Renovate is overkill; a 30-line script
that writes `imageTag: $sha` is fine).

PRs to `main` deploy to staging automatically. Prod deploys are tag-based
(`v2026.04.15-1`) and require manual sync in Argo CD — gives one human-in-loop
moment without slowing the team down.

## Cost guardrails

- `LimitRange` per namespace so an exploded test pod can't eat the node.
- `ResourceQuota` on `huduma-staging` so it can't grow without bound.
- Goldilocks (or Vertical Pod Autoscaler in recommendation mode) running in staging to tune `resources.requests` quarterly.
- Cluster Autoscaler with `--scale-down-utilization-threshold=0.5`.

## What you can skip on day one

- Service mesh (Istio / Linkerd). Plain `Service` + NetworkPolicy is enough.
- Custom operator development. Use community charts.
- Multi-region. One region, three zones is plenty for Kenya-focused traffic.
- Blue/green deploys. Rolling with `maxUnavailable: 0` covers 99% of needs.

Get those when you outgrow the simpler thing — not before.
