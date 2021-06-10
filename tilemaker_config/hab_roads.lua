-- https://taginfo.openstreetmap.org/keys

node_keys = {}

G_DEFAULT = 0
G_COUNTS = {}


function init_function()
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


function Set(list)
	local set = {}
	for _, l in ipairs(list) do set[l] = true end
	return set
end


local function is_in (val, tab)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end
    return false
end


function SetBrunnelAttributes(obj)
	if     obj:Find("bridge") == "yes" then obj:Attribute("brunnel", "bridge")
	elseif obj:Find("tunnel") == "yes" then obj:Attribute("brunnel", "tunnel")
	elseif obj:Find("ford")   == "yes" then obj:Attribute("brunnel", "ford")
	end
end


linkValues = Set { "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link" }


-- https://stackoverflow.com/a/7615129/4288232
function split(inputstr, sep)
	if sep == nil then
		sep = "%s"
	end
	local t={} ; i=1
	for str in string.gmatch(inputstr, "([^"..sep.."]+)") do
		t[i] = str
		i = i + 1
	end
	return t
end


function way_function(way)
	if way:Find("disused") == "yes" then return end

	local name = way:Find("name");

	-- highway
	local highway = way:Find("highway")
	if highway ~= nil and highway ~= "" then
		if highway == "proposed" then return end

		if G_COUNTS["highway"] == nil			then G_COUNTS["highway"] = {}			end
		if G_COUNTS["highway"][highway] == nil	then G_COUNTS["highway"][highway] = 0		end
		G_COUNTS["highway"][highway] = G_COUNTS["highway"][highway] + 1


		local road_type = "unknown"
		local road_min_zoom = 0;
		if is_in( highway, { "motorway", "trunk", "primary" } ) then
			road_type = "road_main"
		end

		if is_in( highway, { "motorway_link", "trunk_link", "primary_link", "secondary", "secondary_link" } ) then
			road_type = "road_secondary"
			road_min_zoom = 6
		end

		if is_in( highway, { "tertiary", "tertiary_link", "unclassified" } )
		then
			road_type = "road_tertiary"
			road_min_zoom = 10
		end

		if is_in( highway, { "track", "road", "living_street", "residential", "footway" } )
		then
			road_type = "other"
			road_min_zoom = 14
		end


		if road_type == "unknown" then
			return
		end


		way:Layer("roads", false)
		way:Attribute("class", highway)
		-- way:Attribute("class", road_type)
		if name ~= nil and name ~= ""	then way:Attribute("name",name)	end
		if road_min_zoom then way:MinZoom(road_min_zoom) end
		SetBrunnelAttributes(way)
		-- Links (ramp)
		if linkValues[highway] then
			splitHighway = split(highway, "_")
			highway = splitHighway[1]
			way:AttributeNumeric("ramp",1)
		end
	end

	-- railway
	local railway = way:Find("railway")
	if railway ~= nil and railway == "rail" then
		if G_COUNTS["railway"] == nil			then G_COUNTS["railway"] = {}			end
		if G_COUNTS["railway"][railway] == nil	then G_COUNTS["railway"][railway] = 0		end
		G_COUNTS["railway"][railway] = G_COUNTS["railway"][railway] + 1

		local layer = "railways"
		way:Layer(layer, false)
		way:Attribute("class", railway)
		if name ~= nil and name ~= ""	then
			way:Attribute("name",name)
		end
	end
end