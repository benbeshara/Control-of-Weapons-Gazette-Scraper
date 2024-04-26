# Control of Weapons Act 1990 Gazette Scraper

This is a scraper for the Victorian government's Gazette archive, which will look for Control of Weapons Act gazettes and list them on a web page.

These notices are poorly circulated and disproportionately affect vulnerable populations. This is a small attempt to help fight back against the capitalist surveillance state by increasing the visibility of these notices and the act.

To run:

1. Install Docker

2. Clone this repository

3. Run `docker-compose up` in the directory you cloned this to

4. Go to `https://localhost:3000/` in your web browser

Feel free to deploy this online at will.

The idea shamelessly stolen from @vicpol_searches on twitter/x, a platform that is increasingly inaccessible.

Routes:

- `/` is the main listing page
- `/list` is the HTML list the main page retrieves
- `/latest` is the data in JSON format

Stay powerful xx
