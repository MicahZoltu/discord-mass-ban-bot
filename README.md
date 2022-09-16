# Discord Mass Ban Bot
## Deployment
1. Create a new Discord Application: https://discord.com/developers/applications
2. Open the Discord Application and click the `Bot` tab on the left nav bar.
3. Give your bot a name and get an auth token for it (this goes into `DISCORD_BOT_AUTH_TOKEN` below)
4. Enable `Message Content Intent` for your bot.
5. Go to OAuth2 > URL Generator in the left nav bar, choose `bot` scope and `Ban Members` + `Send Messages` + `Read Messages/View Channels` + `Read Message History` from `Bot Permissions`.
6. Navigate to the link at the bottom of the page using an account with `Manage Server` permission.
7. Create a new private channel and in server settings set it as the `System Messages Channel`.  Be sure to leave "Send ea random welcome message when someone joins this server" enabled.
8. Make sure the bot can has `Ban Members`, `Send Messages`, `Read Message History` in the system messages channel and `Send Messages` in the admin channel of your choice.
9. Create a `docker-compose.yml` file, or similar `docker run` command with the following, and make sure it can access the internet:
  ```yml
  my-service-name:
    deploy:
      restart_policy:
        condition: 'any'
    environment:
      DISCORD_SERVER_ID: '<server ID of Discord server in question>'
      DISCORD_JOIN_LOG_CHANNEL_ID: '<channel ID that user join logs show up in, should not contain any other messages and should be private>'
      DISCORD_ADMIN_CHANNEL_ID: '<channel ID that the bot should send a message if it notices a raid>'
      DISCORD_BOT_AUTH_TOKEN: '<Discord bot auth token>'
    image: 'micahzoltu/discord-mass-ban-bot@sha256:a7e19954255c33b7855131a0db02e1758b1add8ff146f445c4df379a0f687f44'
    logging:
      driver: 'json-file'
      options:
        max-size: '5m'
    user: 'root'
  ```
10. Run the docker container.
11. When you see a large number of people join in a row, send the following message to the channel: `ban <message ID> <message ID>` where `message id` is the id of the first and last message in the system messages channel that contains the joins you want to ban.
12. The bot will send a message to the channel confirming your intent.
13. React to the bot's message with a 👍
14. Watch the bot ban all of the new joiners.

It is recommended to use this bot along with the 10 minute delay for new members, as this gives you time to react to the raid before they can start DMing people.
