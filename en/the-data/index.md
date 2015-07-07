---
lang: en
layout: the-data
tid: the-data
title: Introduction to the Database
---
The database at the heart of the Com&eacute;die-Française Registers Project derives from the daily box office attendance records kept assiduously by the troupe from its founding in 1680 to the Revolution, and beyond. High resolution virtual reproductions of these records [can be found here](/en/registers/). The troupe maintained detailed receipt records because the Crown insisted that the actors donate a portion of each evening’s proceeds to charities, to mollify the French Catholic critics of the stage&rsquo;s &ldquo;sinfulness.&rdquo; In addition, the members of the troupe split the remaining revenue among themselves according to seniority within the troupe. A detailed accounting was necessary to maintain harmony among the players themselves.

We currently offer four tools to access the database.

1. [Faceted Browser](http://app.cfregisters.org/registers).
This tool allows users introductory access to the database. Here you can explore data about authors, plays, genres, and selected ticket categories by season or by day of the week. By clicking on the camera icons on the left of the screen, you can also open up register pages in a new window.

2. [Cross-Tab Browser](/app).
This tool allows users more advanced access to the database. Here you can build more sophisticated queries which will display in tabular format. The results in turn will eventually be displayed in simple graphs and a calendrical format.

3. Dataclips

4. HTTP API.
This tool is for programmers. It offers full access to a complete copy of the compiled data in JSON format, and a live query interface, with filtering, pagination and ordering functionality. An OPTIONS request to http://api.cfregisters.org/ returns available endpoints; an OPTIONS request to any endpoint returns its structure. Further documentation on query format is available <a href="https://github.com/begriffs/postgrest/wiki/Routing">here</a>.