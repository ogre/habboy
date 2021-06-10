node_keys = {}

G_DEFAULT = 0
G_COUNTS = {}


function zoom_tile_area(latitude_degrees, zoom_level)
	earth_equatorial_circumference = 40075016.686 -- meters
	latitude_radians = 3.14159265359 * latitude_degrees / 180.0
	tile_width = earth_equatorial_circumference * math.cos(latitude_radians) / (2^zoom_level)
	return tile_width*tile_width
end

-- store m2 area for one tile on each zoom level
ZOOM_TILES_AREA = {}


function init_function()
	for i=1,16 do
		ZOOM_TILES_AREA[i] = zoom_tile_area(52.0, i)
		print(ZOOM_TILES_AREA[i])
	end
end


local function is_in (val, tab)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end
    return false
end


function get_min_zoom(in_area)
	local min_zoom = 1
	for _z=15,1,-1 do
		if in_area < (0.01 * ZOOM_TILES_AREA[_z]) then
			return _z
		end
	end
	return min_zoom
end


function exit_function()
	for _k,_v in pairs(G_COUNTS)
	do
		print("\n")
		print(_k)
		for k,v in pairs(_v)
		do
			print("\t", k, v)
		end
	end
end


function node_function(node)
end


function way_function(way)
	local name = way:Find("name");

	-- building
	local building = way:Find("building")
	if building ~= nil and building ~= "" then
		if G_COUNTS["building"] == nil			then G_COUNTS["building"] = {}				end
		if G_COUNTS["building"][building] == nil	then G_COUNTS["building"][building] = 0		end
		G_COUNTS["building"][building] = G_COUNTS["building"][building] + 1

		local layer = "building"
		way:Layer(layer, true)
		way:Attribute("class", building)
		if name ~= nil and name ~= ""	then		way:Attribute("name",name)	end

		local height = way:Find("height");
		if height ~= nil and height ~= ""	then		way:Attribute("height",height)	end
		local min_height = way:Find("min_height");
		if min_height ~= nil and min_height ~= ""	then		way:Attribute("min_height",min_height)	end

	end
end