# eBird-Phetcher

## Overview

One of my friends has been uploading photos to eBird for the last seven years--to the tune of 1800 total photos. He's since lost most of the originals, and since eBird offers no option to bulk download assets, I wrote this script.

Fair warning: while I researched the overall approach for the script, Claude wrote the entirety of the code. In fact, I didn't touch a single line, and I'm really impressed by the output. What would have taken me a day before AI instead took me an evening with a cocktail.

## The Script
- Parses the CSV of your Macaulay Library media, line by line, to retrieve the media identifier
- Makes a call to eBird's endpoint, using a session cookie for authentication
- Fetches the media (image or sound recording) from the pre-signed S3 URL provided by eBird
- Save the files to `./inout/photos` binned by the date on which the photo was taken

Note: the script will only fetch the asset if it is not already present in the output folder. This allows for the script to pick up where it left off if it is aborted during execution.

## Setup
- Save the Macaulay Library media CSV to `./inout/eBirdPhotoList.csv`
- Create `./.env` file with the keys, EBIRD_COOKIE and USER_AGENT, populated using the values from your web session
- Run `npm run dev`

## Limitations
- As of the time of writing, the media CSV exported from Macaulay only supports up to 10,000 rows

## Disclaimer 
This script does not attempt to bypass authentication mechanisms and it should not be used except in good faith. 
