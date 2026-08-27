---
name: ultralytics-platform
description: This skill should be used when user asks to "upload my model to Ultralytics Platform", "push this run to the platform", "upload a dataset to platform", "download a dataset from platform", "search platform datasets", "start cloud training", "train on platform GPUs", "export a model on platform", "deploy a model endpoint", "why is my run not showing on platform", or mentions platform.ultralytics.com, ul:// URIs, ultralytics-platform, or ULTRALYTICS_API_KEY.
---

# Ultralytics Platform

Use `ultralytics` for YOLO training and inference. Use the generated `ultralytics-platform` Python
SDK for API resource work. It follows the same contract as the live API and handles authentication,
typed responses, retries, and errors.

## Read the live contract

Before API work, check the generated [API reference](https://platform.ultralytics.com/api/docs) or
`GET https://platform.ultralytics.com/openapi.json`. Treat the live OpenAPI document as authoritative
when examples disagree. The shapes below match API and SDK v0.1.18, checked on 2026-08-27.

```bash
uv pip install -U "ultralytics-platform>=0.1.18"
export ULTRALYTICS_API_KEY=ul_... # Settings > API Keys
```

`Platform()` reads `ULTRALYTICS_API_KEY`. The `ultralytics` package also reads the key saved by
`yolo login`. Never print or commit a key.

## Choose the interface

| Goal                                                       | Interface                        |
| ---------------------------------------------------------- | -------------------------------- |
| Track a run that has not started                           | `ultralytics` training callback  |
| Train with a Platform dataset or model                     | `ultralytics` with a `ul://` URI |
| Manage datasets, models, training, exports, or deployments | `ultralytics-platform` SDK       |
| Use another language or inspect a new field                | Live OpenAPI                     |

### Live training and `ul://` URIs

Pass an owner-qualified project to stream a run:

```python
from ultralytics import YOLO

YOLO("yolo26n.pt").train(data="coco8.yaml", epochs=100, project="owner/project", name="run1")
```

`project=` is required. Without it, the callback exits before creating a Platform run. Use the
owner prefix for a team workspace.

```python
YOLO("ul://owner/project/model").train(data="ul://owner/datasets/dataset", epochs=100)
```

### SDK

Use a context manager and owner/name paths. Keep returned IDs for operations that require them,
including image operations, upload `assetId`, training `modelId`, and export IDs.

Responses have resource-specific shapes, not a generic envelope. Create calls return `id`, `owner`,
and the URL name at the top level. Detail calls wrap the resource under its type, such as `dataset`.
A rename changes the URL name, so use the name returned by the update response.

Read [references/recipes.md](references/recipes.md) for live-run diagnosis, finished-run upload,
dataset upload, and billable jobs.

## Invariants

- Confirm the target workspace with `client.account.summary()` and read the exact resource before a
  mutation. Team work requires an API key created in that workspace.
- A direct upload is signed URL, `PUT` with the returned `headers`, upload completion, then dataset
  ingest. Model uploads stop after completion.
- Dataset ingest accepts one source: `sessionId`, `sourceUrl`, or a connected-storage `reference`.
  Set `targetSplit` when every incoming image must enter one split.
- Top-level model `metrics` accepts only the contract's named summary metrics. Per-epoch
  `trainResults[].metrics` accepts numeric metric names from `results.csv`.
- On `429`, wait for `Retry-After` before retrying. Do not invent fixed sleeps.

## Cost and destructive actions

Cloud training, model exports, and deployments can spend credits. Get approval before calling
`client.training.start`, `client.exports.create`, or `client.deployments.create`, then report the
cost returned by the create response. Get approval before deletes. Resource deletes move projects,
datasets, and models to 30-day trash. `client.lifecycle.delete_trash` is permanent.
