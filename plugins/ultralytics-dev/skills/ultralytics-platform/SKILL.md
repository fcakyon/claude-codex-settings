---
name: ultralytics-platform
description: This skill should be used when user asks to "upload my model to Ultralytics Platform", "push this run to the platform", "upload a dataset to platform", "download a dataset from platform", "search platform datasets", "start cloud training", "train on platform GPUs", "export a model on platform", "deploy a model endpoint", "why is my run not showing on platform", or mentions platform.ultralytics.com, ul:// URIs, or ULTRALYTICS_API_KEY.
---

# Ultralytics Platform

REST API at `https://platform.ultralytics.com`, auth `Authorization: Bearer ul_...`.
Interactive spec: `GET /openapi.json` (needs the bearer header).

The auth shape and the four gotchas below were run against the live API on
2026-08-04. Endpoint shapes not covered by those runs come from `/openapi.json` and are marked
unverified in `references/`.

## Get the key first

```bash
export ULTRALYTICS_API_KEY=ul_... # Settings > API Keys on platform.ultralytics.com
```

The `ultralytics` package reads `ULTRALYTICS_API_KEY` env first, then `api_key` in
`settings.json` (`yolo settings api_key=ul_...`). Check both before assuming the key is missing.

## Pick the path before writing any code

| Goal                                                          | Path                      |
| ------------------------------------------------------------- | ------------------------- |
| Track a run that has **not started yet**                      | Package callback, no REST |
| Push a run that **already finished**                          | REST retro upload         |
| Read a platform dataset or model in training code             | `ul://` URI               |
| Upload/download datasets, search, cloud train, export, deploy | REST                      |

### Package callback (live runs)

Set the key and pass `project=`, then train normally. `ultralytics/utils/callbacks/platform.py`
streams per-epoch metrics, system metrics, console output, PR/F1/confusion-matrix plots, and
uploads `best.pt` at the end.

```python
model.train(data="coco8.yaml", epochs=100, project="my-project", name="run1")
```

**`project=` is mandatory.** The callback returns early without it, so no key and no `project=`
both produce the same silent nothing. That is the #1 cause of "I trained but the platform is
empty". See `references/recipes.md` for the full enablement gate and the other failure modes.

### `ul://` URIs

Resolve to signed URLs inside `data=` and `model=`, no manual download:

```python
YOLO("ul://username/my-project/my-model").train(data="ul://username/datasets/my-dataset", epochs=100)
```

## REST

Read `references/recipes.md` before writing a request. It carries working code for retro upload
of a finished run, dataset upload and download, search, cloud training, export, deployment, and
cleanup. Each section states whether it was run live or derived from the spec.

`references/api-reference.md` is the endpoint table plus the request shapes.

## Four things that break first-time requests

1. **`POST /api/models` and `GET /api/models` need the 24-char project ID, not the slug.** Every
   other endpoint accepts a slug in the path. These two return `400 Invalid project ID` for a slug
   even though the parameter is documented as "name or ID". Create the project first and keep the
   returned `projectId`.
2. **Top-level `metrics` is a closed key set**, listed in `references/api-reference.md`. Posting
   a raw `results.csv` key like `metrics/mAP50-95(B)` returns `400 Unrecognized key`.
   `trainResults[].metrics` is free-form, so csv rows go in there as is.
3. **Uploads are three calls, not one.** `POST /api/upload/signed-url` to get the URL, plain
   `PUT` of the bytes to that URL with no auth header, then `POST /api/upload/complete`. Skipping
   the third call leaves the file unattached.
4. **Deletes are soft.** `DELETE /api/projects/{id}` moves to trash and cascades to its models.
   `DELETE /api/trash/empty` makes it permanent.

## Cost and destructive actions

`POST /api/training/start`, `POST /api/exports`, and `POST /api/deployments` spend credits.
The cost comes back in the create response, not from a lookup beforehand, so report
`billing.estimatedCostDisplay` from the `POST` result before letting the job run.
Confirm with the user before any create-with-cost or any delete.
