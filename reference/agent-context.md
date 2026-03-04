# Font-to-JSON

This project aims to create a JavaScript library that can read in a binary font file (OTF, TTF, WOFF) and convert it's data into JSON format. Secondarily, this library will be able to take a properly formatted JSON file and convert it back to a font file. This will be distributed as a single .js file using JavaScript modules to be included in front-end HTML5 font editor programs.

I am a human and I will write notes to you, a coding agent, in this file agent-context.md I have also created a file for you called `reference\agent-written-notes.md` this is a space for you to maintain. As this project proceeds, it will be iterative, and along the way new agents will have to get up to speed and be effective contributing to this project. Periodically, please look back at what you have done and make notes in this file. The contents do not have to make sense to a human, the goal is to make future agents onboard and be effective to this project as efficiently as possible.

# Specs and context

Different font formats have the following spec that can be referenced when parsing and writing font files

## OTF

Overview: https://learn.microsoft.com/en-us/typography/opentype/spec/overview
Font file: https://learn.microsoft.com/en-us/typography/opentype/spec/otff
Tables: https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables

## TTF

Table of contents: https://developer.apple.com/fonts/TrueType-Reference-Manual/
Tables: https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6.html

## WOFF

WOFF and WOFF2 will come later

# Project organization

## src

This will be where all main code is written. It should be organized in a way that will make sense to human maintainers. The root can have individual JS files that contain similar functionality. The `src` folder will have a `main.js` file where everything starts, and exposes the main import and export functionality. Additional `import.js` and `export.js` files will hold conversion code.

In addition, there will be child folders for each font type ("otf", "ttf", and eventually "woff") and in each of those folders, import and export code will be broken down further by table, in files with the naming convention (if the table has the name XYZ): `table_XYZ.js`. One special note is the "OS/2" table, this should be referred to in code and file names as "OS-2". Font tables have mixed uppercase / lowercase, and table name case should always be honored.

## test

The test folder will have a similar organization to the `src` folder, but contain tests. The main test in the root of the folder will be a "round trip" test. This will be importing a sample test file, converting it to JSON, then converting it back to the same type of font, then importing it again to convert it to a second JSON file. The idea is the first and second JSON files will match, showing no import or export errors.

## dist

This will be a place where the `src` files will be bundled for distribution or publishing. We will do this after main functionality meets a minimum bar

## reference

This folder will be for reference materials, project notes, and possibly spec files.

# Project plan

Here is the order in which we will build this library.

We will start with OTF fonts, importing and exporting general file header data, then moving on to tables in this order:
'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS-2', 'post'

When support for a table is being written, the flow will work like this (using OTF as an example file format and 'OS/2' as an example table):
1. read the online spec to understand that table and how it is constructed.
2. create a file in `src\otf` that will handle OS/2 data called `table_OS-2.js`, which will contain both the logic that will read binary data and convert it to JSON, as well as take well-formatted JSON data and convert it back into binary for that table.
3. add any updates to `src\main.js` or any other JS files in src that may need to handle this new table.
4. create a file in `test\otf` called `table_OS-2.test.js` for any table specific tests.
