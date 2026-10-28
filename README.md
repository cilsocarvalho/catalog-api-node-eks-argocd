# Catalog API on Amazon EKS with Argo CD GitOps

A complete GitOps delivery path for a small Node.js/Express API on Amazon EKS: the application code, its Dockerfile, a Helm chart, per-environment values and the Argo CD (app of apps) definitions all live in this one repository. A GitHub Actions pipeline builds the image, pushes it to Amazon ECR through GitHub OIDC (no static AWS keys) and commits the new tag back to `envs/dev/values.yaml`, which Argo CD then syncs to the cluster.

```
git push ─▶ GitHub Actions ─▶ docker build ─▶ Amazon ECR
                 │                                 ▲
                 └─ commit new tag to envs/dev ─┐  │ pull image
                                                ▼  │
                          Argo CD (app of apps) ─▶ Amazon EKS
                                                    ├─ catalog-dev   (auto sync)
                                                    ├─ catalog-stage (auto sync)
                                                    └─ catalog-prod  (manual sync)
```

**Stack:** Amazon EKS · Argo CD · Helm · Amazon ECR · GitHub Actions with OIDC · AWS Load Balancer Controller (ALB Ingress) · ACM · Node.js/Express · Jest

## What it demonstrates

- **GitOps end to end**: Git is the only way to change what runs; CI never talks to the cluster.
- **Keyless CI**: GitHub Actions assumes an IAM role through OIDC to push to ECR.
- **Promotion by environment**: dev and stage sync automatically, prod syncs manually.
- **Production-grade workload settings**: startup, readiness and liveness probes, requests and limits, HPA, PodDisruptionBudget and a restrictive NetworkPolicy.
- **Hardened container**: non-root user, read-only root filesystem and a HEALTHCHECK.
- **Scoped Argo CD project**: the application can only deploy to its own namespaces.
- **TLS at the edge**: HTTPS on the ALB Ingress with an ACM certificate.

## Repository layout

| Path | Contents |
|---|---|
| `src/`, `tests/` | Express API and Jest tests |
| `Dockerfile`, `Makefile` | Container build and local commands |
| `charts/catalog-api/` | Helm chart: Deployment, Service, Ingress, HPA, PDB, NetworkPolicy |
| `envs/dev`, `envs/stage`, `envs/prod` | Per-environment values (the files GitOps changes) |
| `argocd/` | Argo CD project, root application and one Application per environment |
| `.github/workflows/ci-gitops.yml` | Lint, tests, Helm render and image build; then push to ECR and bump the dev image tag |

## Run locally

```bash
make build TAG=dev
make run   TAG=dev   # http://localhost:8080
make test
```

## Deploy to your own AWS account

1. **Prepare the platform (once)**
   - Create an ECR repository named `catalog-api`.
   - Install Argo CD: `kubectl create ns argocd && kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`
   - Install the AWS Load Balancer Controller (Ingress class `alb`).
   - Optional: External Secrets and Kyverno.
2. **Point the repo at your account**: replace the example account `111122223333` in `charts/catalog-api/values.yaml` and `envs/*/values.yaml`, and set your `OWNER/REPO` in `argocd/root-app.yaml` and `argocd/apps/*.yaml`.
3. **Connect CI to AWS**: create an IAM role trusted by GitHub OIDC with permission to push to ECR. In the repository settings, save its ARN as the `AWS_ROLE_TO_ASSUME` secret and add the variables `AWS_ACCOUNT_ID` and `AWS_REGION` (default `sa-east-1`). Until `AWS_ACCOUNT_ID` exists the pipeline runs lint, tests, Helm rendering and a Docker build only.
4. **Bootstrap Argo CD**
   ```bash
   kubectl apply -f argocd/project-portfolio.yaml
   kubectl apply -f argocd/root-app.yaml
   ```
   The root application creates one Application per environment.
5. **Ship a change**: push to `main`. After the tests pass, the pipeline builds `catalog-api:<commit-sha>`, pushes it to ECR and commits the tag to `envs/dev/values.yaml`; Argo CD rolls it out to EKS.

See [setup.md](setup.md) for certificates, namespaces and application secrets.

## Environments

| Environment | Values file | Replicas | Sync |
|---|---|---|---|
| Dev | `envs/dev/values.yaml` | 2 | Automatic |
| Stage | `envs/stage/values.yaml` | 3 | Automatic |
| Prod | `envs/prod/values.yaml` | 5 | Manual |

## API

| Endpoint | Access |
|---|---|
| `GET /` | Public, service metadata |
| `GET /health` | Public, health check |
| `GET /products` | Basic auth, product list (`API_USER` / `API_PASSWORD` from a Kubernetes Secret) |
| `GET /products/:id` | Basic auth, single product |
