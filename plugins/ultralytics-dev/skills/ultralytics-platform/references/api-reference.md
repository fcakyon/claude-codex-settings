# Platform API reference

Base `https://platform.ultralytics.com`, header `Authorization: Bearer ul_...`.
Full spec: `curl -H "Authorization: Bearer $ULTRALYTICS_API_KEY" https://platform.ultralytics.com/openapi.json`.

Path parameters accept a URL slug (`my-dataset`) or a 24-char ID. The two exceptions are
`POST /api/models` (body `projectId`) and `GET /api/models` (query `projectId`), which require the ID.

## Datasets

| Method | Path                                      | Notes                                                               |
| ------ | ----------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/datasets`                           | `limit` (max 1000), `username`, `owner`, `region`, `includeSamples` |
| POST   | `/api/datasets`                           | requires `slug`, `name`, `task`, `imageCount`, `format`             |
| GET    | `/api/datasets/{id}`                      | detail                                                              |
| PATCH  | `/api/datasets/{id}`                      | rename, visibility, tags, license                                   |
| DELETE | `/api/datasets/{id}`                      | soft delete to trash                                                |
| POST   | `/api/datasets/ingest`                    | `datasetId` plus exactly one of `sessionId` or `sourceUrl`          |
| GET    | `/api/datasets/{id}/export`               | signed NDJSON download URL, `?v=N` for a saved version              |
| POST   | `/api/datasets/{id}/export`               | freeze an immutable numbered version                                |
| GET    | `/api/datasets/{id}/class-stats`          | per-class instance counts                                           |
| GET    | `/api/datasets/{id}/images`               | list, paginated                                                     |
| PATCH  | `/api/datasets/{id}/images/bulk`          | move images between splits                                          |
| POST   | `/api/datasets/{id}/splits/redistribute`  | re-split train/val/test                                             |
| POST   | `/api/datasets/{id}/classes/merge`        | merge class names                                                   |
| POST   | `/api/datasets/{id}/predict`              | auto-annotate with a model                                          |
| PUT    | `/api/datasets/{id}/images/{hash}/labels` | edit one image's labels                                             |
| POST   | `/api/datasets/{id}/embeddings`           | run similarity analysis                                             |
| GET    | `/api/datasets/{id}/images/clustering`    | 2D embedding layout                                                 |
| POST   | `/api/datasets/{id}/clone`                | copy an accessible dataset                                          |

`task`: detect, segment, semantic, classify, pose, obb.
`format`: yolo, coco, voc, raw, ndjson.
Ingest `conflictPolicy`: skip, keep_both, replace. `targetSplit` overrides the archive's own layout.

## Projects and models

| Method               | Path                        | Notes                                                     |
| -------------------- | --------------------------- | --------------------------------------------------------- |
| GET / POST           | `/api/projects`             | create needs `slug` + `name`                              |
| GET / PATCH / DELETE | `/api/projects/{id}`        | delete cascades to models                                 |
| GET                  | `/api/models`               | `projectId` required, `fields=summary` or `fields=charts` |
| POST                 | `/api/models`               | create a model record, body `projectId`                   |
| GET                  | `/api/models/completed`     | usable models across all projects                         |
| GET / PATCH / DELETE | `/api/models/{id}`          | `?project=my-project` disambiguates a slug                |
| GET                  | `/api/models/{id}/files`    | signed download URLs, valid 1 hour                        |
| POST                 | `/api/models/{id}/predict`  | inference on stored weights                               |
| GET                  | `/api/models/{id}/training` | live status, epoch, timing, metrics                       |
| DELETE               | `/api/models/{id}/training` | cancel a running job                                      |

### POST /api/models body

| Field                                    | Type             | Notes                                                                              |
| ---------------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `projectId`                              | string           | required                                                                           |
| `slug`                                   | string           | `^[a-z0-9-]+$`                                                                     |
| `name`, `description`, `version`, `docs` | string           |                                                                                    |
| `task`                                   | enum             | detect, segment, semantic, depth, classify, pose, obb                              |
| `trainArgs`                              | object           | free-form, mirror `args.yaml`                                                      |
| `trainResults`                           | array, max 10000 | `{epoch, metrics{str: number}, system, fitness, timestamp}`, free-form metric keys |
| `metrics`                                | object           | closed key set, see below                                                          |
| `epochs`                                 | number           |                                                                                    |
| `environment`                            | object           | free-form host/git/gpu info                                                        |
| `completedAt`                            | ISO 8601         | must end in `Z`                                                                    |

Allowed `metrics` keys, everything else returns `400 Unrecognized key`:
`mAP50`, `mAP50-95`, `precision`, `recall`, `accuracy_top1`, `accuracy_top5`, `miou`,
`pixel_acc`, `delta1`, `abs_rel`, `rmse`, `silog`.

No `plots` field exists. PR curves, F1 curves, and confusion matrices reach the platform only
through the training callback.

## Uploads

| Method | Path                     | Notes                                                                                              |
| ------ | ------------------------ | -------------------------------------------------------------------------------------------------- |
| POST   | `/api/upload/signed-url` | `assetType` (models, datasets, images, videos), `assetId`, `filename`, `contentType`, `totalBytes` |
| POST   | `/api/upload/complete`   | `sessionId`, optional `checksum`                                                                   |

`assetId` is validated against a real record, a bad one returns `404 Model not found`.
The `PUT` to `uploadUrl` carries no `Authorization` header, the signature is in the URL.
`uploadUrl` expires, `expiresAt` is in the signed-url response.

## Cloud training

| Method | Path                             | Notes                                          |
| ------ | -------------------------------- | ---------------------------------------------- |
| POST   | `/api/training/start`            | `modelId`, `projectId`, `trainArgs`, `gpuType` |
| GET    | `/api/training/gpu-availability` | stock status per GPU id                        |

`gpuType`: `rtx-4090` (default), `a100`, `h100`.
`trainArgs` requires `model`, `data`, `epochs` and accepts any other `default.yaml` key.
`model` and `data` accept `ul://` URIs or shipped names (`yolo26n.pt`, `coco8.yaml`).
The response returns `estimatedCost.pricePerHour`, `billing.estimatedCostCents`, and a
preformatted `billing.estimatedCostDisplay`. Show these
to the user before starting.

## Exports and deployments

| Method       | Path                            | Notes                                                |
| ------------ | ------------------------------- | ---------------------------------------------------- |
| GET / POST   | `/api/exports`                  | `modelId`, `format`, `gpuType` (engine only), `args` |
| GET / DELETE | `/api/exports/{id}`             | status, cancel                                       |
| GET / POST   | `/api/deployments`              | `modelId`, `name`, `region`, `resources`             |
| GET / DELETE | `/api/deployments/{id}`         | detail, delete                                       |
| POST         | `/api/deployments/{id}/predict` | inference on the endpoint                            |
| GET          | `/api/deployments/{id}/health`  | readiness, also `/metrics` and `/logs`               |
| POST         | `/api/deployments/{id}/start`   | also `/stop`                                         |

Export `args`: `imgsz`, `quantize` (8/16/32 or int8/fp16/fp32 or w8a8/w16a16/w8a16/w8a32),
`dynamic`, `simplify`, `opset` (9-23), `batch`, `nms`, `end2end`, `workspace`, `conf`, `iou`,
plus a `name` target for RKNN, QNN, Hailo, and Ascend.
Deployment `resources`: `cpu` 1-8, `memoryGi` 1-32, `minInstances` 0-10 (0 scales to zero),
`maxInstances` 1-100.

## Discovery and account

| Method              | Path                                 | Notes                                                                              |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| GET                 | `/api/explore/search`                | `q`, `type` (all/projects/datasets), `sort`, `task`, `author`, `starred`, `offset` |
| GET                 | `/api/explore/sidebar`               | curated public resources                                                           |
| GET                 | `/api/account/summary`               | username, plan, credits, resource counts                                           |
| GET                 | `/api/billing/balance`               | credit balance                                                                     |
| GET                 | `/api/billing/usage-summary`         | plan and usage                                                                     |
| GET                 | `/api/storage`                       | storage usage                                                                      |
| GET                 | `/api/activity`                      | recent events                                                                      |
| GET / POST / DELETE | `/api/api-keys`                      | manage keys                                                                        |
| GET / POST          | `/api/teams`, `/api/members`         | team management                                                                    |
| GET / POST          | `/api/integrations/buckets`          | S3, GCS, Azure connections                                                         |
| POST                | `/api/integrations/roboflow/preview` | also `/import`                                                                     |
| GET / POST / DELETE | `/api/trash`                         | plus `DELETE /api/trash/empty` to purge                                            |

`sort` values: stars, newest, oldest, name-asc, name-desc, count-desc, count-asc.
`/api/explore/search` works unauthenticated except for `starred`.

## Error codes seen in practice

| Code                          | Meaning                                        |
| ----------------------------- | ---------------------------------------------- |
| 400 `Invalid project ID`      | slug passed where the ID is required           |
| 400 `Unrecognized key: "..."` | key outside a closed schema, usually `metrics` |
| 401 `Unauthorized`            | missing or wrong bearer token                  |
| 404 `Model not found`         | bad `assetId` or `modelId`                     |
| 409                           | resource still processing, retry later         |
