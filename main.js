import Introspect from "./introspect.js"
import * as Dbus from "./dbus"

export let defaults= {
	prefix: "INTROSPECT_",
	service: "org.freedesktop.DBus",
	busName: "default",
	execFilter: x=> JSON.stringify( x.result, null, '\t')
}

export function debugMode(){
	process.on( "unhandledRejection", err=> console.error( err))
}

export async function introspect( opts){
	var
	  e= await env(),
	  result= await Introspect( e),
	  recombinantFpShit= Object.assign({}, e, { result})
	return recombinantFpShit // this is actually how i like to combine stuff, slowly, declaratively.
}

export async function main( opts){
	opts= opts|| {}
	var filter= opts.execFilter|| defaults.execFilter|| function(i){return i}
	var fn= opts.fn|| introspect
	return await fn()
		.then( filter)
		.then( console.log.bind( console)) // show the root path
}

export async function signalListen( path){
	var
	  ctx= await exec()
	  run= Object.keys( ctx).map(async function( key){
		var
		  path= ctx[ key],
		  signals= path.signals
		//dbus.getInterface( key, path.name)
		
	  })
}

export async function env( opts){
	function o( a){
		return opts&& opts[ a]
	}
	var
	  p= o( "prefix")|| defaults.prefix,
	  service= o( "service")|| process.env[ p+ "SERVICE"]|| process.argv[2]|| defaults.service,
	  busName= o( "busName")|| process.env[ p+ "DBUS"]|| defaults.busName,
	  dbus= o( "dbus")|| Dbus[ busName](), // "session", "system" or "default" or else
	  path= o( "path")|| process.env[ p+ "PATH"], // undefined aok: underlying `introspect` default is "/" which is great. it recurses through (c.o. all-in-one dependency).
	  nodes= o( "nodes")|| [], // permits userland a reference to nodes, which will grow through all descendants of the path
	  params= o( "params")|| {
		prefix: p,
		service,
		busName,
		dbus,
		path,
		nodes
	  }
	return params
}

export default main;
