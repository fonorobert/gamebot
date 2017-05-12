# gamebot

## Running locally
1. `npm install`
2. `npm run build && TOKEN=xxxx-11111111111-xxxxxxxxxxxxxxxxxxxxxxxx npm start`

⚠️ Depending on your node version, `npm install` will fail when building `lwip`. To solve this you need to:
1. Switch to node v7.5.0 (or v6.10.0 if you're on v6)
2. Run `npm install`
3. Switch back to your default node version
4. `npm run build && TOKEN=xxxx-11111111111-xxxxxxxxxxxxxxxxxxxxxxxx npm start`

## Running in production
Don't forget to set `PRODUCTION=true`.
