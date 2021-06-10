#!/bin/sh

##
# $1 is path to PBF file
# $2 is output dir
# /usr/bin/time -v is used to report execution time and memory usage

mkdir $2
/usr/bin/time -v ./tilemaker  $1 --output $2/aeroway       --config ./hab_aeroway.json 	    --process ./hab_aeroway.lua
/usr/bin/time -v ./tilemaker  $1 --output $2/buildings     --config ./hab_buildings.json 	    --process ./hab_buildings.lua
/usr/bin/time -v ./tilemaker  $1 --output $2/landuse       --config ./hab_landuse.json 	    --process ./hab_landuse.lua
/usr/bin/time -v ./tilemaker  $1 --output $2/roads         --config ./hab_roads.json 		    --process ./hab_roads.lua
/usr/bin/time -v ./tilemaker  $1 --output $2/water         --config ./hab_water.json 		    --process ./hab_water.lua
/usr/bin/time -v ./tilemaker  $1 --output $2/labels        --config ./hab_labels.json 	    --process ./hab_labels.lua
/usr/bin/time -v ./tilemaker  $1 --output $2/admin         --config ./hab_admin.json 		    --process ./hab_admin.lua
