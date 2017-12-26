import Introspect from "./introspect.js"
import promisify from "es6-promisify"
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
	opts= opts|| {}
	if( opts.then){
		opts= await opts
	}
	var
	  e= await env( opts),
	  result= await Introspect( e),
	  recombinantFpShit= Object.assign(e, { result})
	e.dbus.connection.end()
	return recombinantFpShit // this is actually how i like to combine stuff, slowly, declaratively.
}

export async function main( opts){
	opts= opts|| {}
	if( opts.then){
		opts= await opts
	}
	var filter= opts.execFilter|| defaults.execFilter|| function(i){return i}
	var fn= opts.fn|| introspect
	return await fn()
		.then( filter)
		.then( console.log.bind( console)) // show the root path
}

export async function listNames( opts){
	var
	  mod= await import( "./list-names.js"),
	  e= await env( opts),
	  names= await mod.default( e)
	for( var name of names){
		if( e.allNames|| name.startsWith(":")){
			continue
		}
		console.log( name)
	}
	e.dbus.connection.end()
}


function True(){
	return true
}

export async function signalListen( path, iface, signalName){
	if( typeof( iface)=== "string"){
		var _iface= iface
		iface= function( val){
			return val=== _iface
		}
	}
	if( !iface){
		iface= True
	}
	if( typeof( signalName)=== "string"){
		var _signalName= signalName
		signalName= function( val){
			return val=== _signalName
		}
	}
	if( !signalName){
		signalName= True
	}
	var
	  e= await env(),
	  intro= (await introspect( e)).result,
	  service= e.dbus.getService( e.service),
	  getInterface= promisify( service.getInterface, service),
	  run= Object.values( intro).map(async function( path){
		var
		  allIfaces= Object.values( path.interface|| []),
		  filteredIfaces= allIfaces.filter( i=> iface( i.name))
		async function runIface( iface){
			var signals= (iface.signal|| []).filter( s=> signalName( s.name))
			if( !signals.length){
				return
			}
			var dbusIface= await getInterface( path.path, path.name)
			signals.forEach( s=> dbusIface.on( s.name, console.log.bind( console)))
			//signals.forEach( s=> console.log({ signal: s.name, path: path.path, interface: path.name}))
		}
		return Promise.all( filteredIfaces.map(runIface))
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
	return Object.assign({}, opts, params)
}

export default main;
