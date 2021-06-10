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

	-- Landuse
	local landuse = way:Find("landuse")
	if landuse ~= nil and landuse ~= "" then
		if G_COUNTS["landuse"] == nil			then G_COUNTS["landuse"] = {}			end
		if G_COUNTS["landuse"][landuse] == nil	then G_COUNTS["landuse"][landuse] = 0	end
		G_COUNTS["landuse"][landuse] = G_COUNTS["landuse"][landuse] + 1

		local layer = "landuse"
		way:Layer(layer, way:IsClosed())
		way:Attribute("class", landuse)
		way:MinZoom( get_min_zoom(way:Area()) )
		if name ~= nil and name ~= "" then	way:Attribute("name",name)	end
	end

	-- Natural
	local natural = way:Find("natural")
	if natural ~= nil and natural ~= "" then
		if G_COUNTS["natural"] == nil			then G_COUNTS["natural"] = {}			end
		if G_COUNTS["natural"][natural] == nil	then G_COUNTS["natural"][natural] = 0	end
		G_COUNTS["natural"][natural] = G_COUNTS["natural"][natural] + 1

		if is_in( natural, { "wood", "forest", "scrub", "heath", "grassland", "fell", "bare_rock", "scree", "shingle", "sand", "meadow" } ) then
			local layer = "natural"
			way:Layer(layer, way:IsClosed())
			way:Attribute("class", natural)
			way:MinZoom( get_min_zoom(way:Area()) )
			if name ~= nil and name ~= "" then	way:Attribute("name",name)	end
		end
	end
end