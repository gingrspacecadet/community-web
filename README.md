# Welcome to the bigstone community web!
### We like people to contribute stuff (dont play around with database / api,)

Local start up:
```wrangler pages dev public```

Local db set up:
```wrangler d1 execute community-web --local --file=sql/local.sql```

Local db file run:
```wrangler d1 execute community-web --file=sql/FILENAME.sql```


Functions right now:
- [ ] Main page
- [ ] Wiki
- [x] Authentication
    - [x] Basic Auth
    - [x] Discord Auth
- [ ] Admin roles
