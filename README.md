# gamebot

## Running locally
1. `npm install`
2. `CLIENT_ID=xxxxxxxxxx.yyyyyyyyyyyy CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx npm run serve`

⚠️ Depending on your node version, `npm install` will fail when building `lwip`. To solve this you need to:
1. Switch to node v7.5.0 (or v6.10.0 if you're on v6)
2. Run `npm install`
3. Switch back to your default node version
4. `CLIENT_ID=xxxxxxxxxx.yyyyyyyyyyyy CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx npm run serve`

If you don't know what `CLIENT_ID` and `CLIENT_SECRET` are, please read [https://medium.com/slack-developer-blog/easy-peasy-bots-getting-started-96b65e6049bf](this). `TODO: add more details on that`

## Running in production
Don't forget to set `PRODUCTION=true`.
