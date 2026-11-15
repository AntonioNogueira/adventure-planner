# Dakar Rally editions for the Inspiration map

Builds `scripts/inspiration/dakar.mjs` from each edition's stage table on English Wikipedia.

```
mkdir -p /tmp/dakar
NODE_USE_ENV_PROXY=1 node scripts/inspiration/dakar/1-fetch.mjs /tmp/dakar      # raw wikitext, 2 s between requests
node scripts/inspiration/dakar/2-parse.mjs /tmp/dakar                            # stage start/finish towns -> stages.json
NODE_USE_ENV_PROXY=1 node scripts/inspiration/dakar/3-generate.mjs /tmp/dakar scripts/inspiration/dakar.mjs
node scripts/inspiration/build.mjs dakar-2027                                    # then build the new edition
```

Check the generator's report: places not found, and big jumps (usually a town that shares its name with another).
Fix them in `PIN` / `PIN_YEAR` in 3-generate.mjs. Editions with no stage table on English Wikipedia
(1983–1989, 1991, 1993, 1994) are not included yet.
