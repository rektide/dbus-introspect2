import allInAll from "all-in-all"
import {Document} from "basichtml"
import Dbus from "./dbus.js"
import promisify from "es6-promisify"

async function introspect( opts){
	if( typeof( opts)=== "string"){
		opts= { service: opts}
	}
	if( !opts.service){
		throw new Error()
	}
	if( !opts.dbus){
		opts.dbus= Dbus()
	}
	if( !opts.nodes){
		opts.nodes= []
	}
	if( !opts.path){
		opts.path= "/"
	}
	if( !opts.result){
		opts.result= {}
	}
	var
	  _service= dbus.getService( service),
	  getInterface= promisify( _service.getInterface, _service),
	  knownPaths= {},
	  all= []
	async function addPath( path){
		if( knownPaths[ path]){
			return
		}
		knownPaths[ path]= true

		// record interface
		var iface= getInterface( path, "org.freedesktop.DBus.Introspectable")
		var introspect= iface.then( function( iface){
			// remember path
			iface.path= path
			// read introspection doc in
			var
			  introspect= promisify(iface.Introspect, iface)(),
			  doc= new Document(),
			doc.innerHTML= iface
			// follow all node links
			var nodes= doc.querySelectorAll( "node[name]")
			nodes.forEach( node=> addPath( node.getAttribute("name")))
			// read methods
			var methods= doc.querySelectorAll("method[name]")
			// read signals
			var signals= doc.querySelectorAll("signal[name]")
		})
		all.push( introspect)
	}
	addPath( opts.path)
	return allInAll( all).then( ()=> opts.result)
}

export default introspect
