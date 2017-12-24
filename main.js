import introspect from "./introspect.js"
import * as Dbus from "./dbus"

export let defaults= {
	prefix: "INTROSPECT_",
	service: "org.freedesktop.DBus",
	busName: "default"
}

export async function exec( opts){
	function o( a){
		return opts&& opts[ a]
	}
	var
	  p= o( "prefix")|| defaults.prefix,
	  service= o( "service")|| process.env[ p+ "SERVICE"]|| process.argv[2]|| defaults.service,
	  busName= o( "busName")|| process.env[ p+ "DBUS"]|| defaults.busName,
	  dbus= o( "dbus")|| Dbus[ busName](), // "session", "system" or "default" or else
	  path= o( "path")|| processe.env[ p+ "PATH"], // undefined aok: underlying `introspect` default is "/" which is great. it recurses through (c.o. all-in-one dependency).
	  nodes= o( "nodes")|| [], // permits userland a reference to nodes, which will grow through all descendants of the path
	  params= o( "paams")||{
		service,
		dbus,
		path,
		nodes
	  },
	  result= await introspect( params),
	  recombinantFpShit= result.then( result=> Object.assign({}, params, { result}))
	return recombinantFpShit
}

export function main( opts){
	exec.then( result=> console.log( opts.result))
}

export default main;
