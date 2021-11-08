# OpenMensa Parser for ASB Hessen

## How it works
This is a parser to 
1. read menus from ASB Hessen website (see https://www.menuebestellung.de/asb-heserv) 
2. convert them into OpenMensa format (see http://openmensa.org/open-mensa-v2)
3. and offer the result as XML feed (see https://doc.openmensa.org/feed/v2/)

It depends on NodeJS [express framework](https://expressjs.com/) (for API handling) and [jsdom](https://www.npmjs.com/package/jsdom) (for parsing).

## How to use
Deploy on your favorite NodeJS platform, e.g. GCP Cloud Functions or AWS Lambda. Done.

## Note
This parser is a private project and has no implications with OpenMensa or ASB whatsoever. In case you find a bug, please raise an issue.