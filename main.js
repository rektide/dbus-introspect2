import introspect from "./introspect.js"
import * as Dbus from "./dbus"

export let defaults= {
	prefix: "INTROSPECT_",
	service: "org.freedesktop.DBus",
	busName: "default"
	
}

function exec( opts){
	function o( a){
		return opts&& opts[ a]
	}
	var
	  p= o('prefix')|| defaults.prefix,
	  service= process.env[ p+ "SERVICE"]|| process.argv[2]|| defaults.service,
	  busName= process.env[ p+ "DBUS"]|| defaults.busName,
	  dbus= Dbus[ busName](), // "session", "system" or "default" or else
	  path= processe.env[ p+ "PATH"] // undefined aok: underlying `introspect` default is "/" which is great. it recurses through (c.o. all-in-one dependency).
	  nodes= [], // permits userland a reference to nodes, which will grow through all descendants of the path
	  params= {
		service,
		dbus,
		path,
		nodes
	  },
	  result= introspect(params),
	  recombinantFpShit= result.then( result=> { result, ..params})
	return recombinantFpShit
}

function main( opts){
	exec.then( result=> console.log( opts.result)
}

export default main;
export main;
