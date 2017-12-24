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
	async function addPath( path, current){
		if( !path){
			return
		}
		// make path absolute
		if( current&& path[0]!= '/'){
			// path names may be relative or absolute- build absolute
			var sep= current[ current.length- 1]!= '/'? '/': ''
			path= current+ sep+ path
		}
		// check for path
		if( knownPaths[ path]){
			// already working on so ignore
			return
		}
		// working on now
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
			var nodes= doc.querySelectorAll( "node")
			nodes.forEach( node=> addPath( node.getAttribute("name"), path))
			// read methods
			var method= doc.querySelectorAll("method").map( Method.parse)
			// read properties
			var property= doc.querySelectorAll("property").map( Property.parse)
			// read signals
			var signal= doc.querySelectorAll("signal").map( Signal.parse)
			var result= {
				name,
				path,
				method,
				property,
				signal
			}
			opts.result.push( result)
		})
		all.push( introspect)
	}
	addPath( opts.path)
	return allInAll( all).then( ()=> opts.result)
}
export default introspect

export class Interface{
	static parse( name, path, dom){
		
	}
	// name, path, method, property, signal
}

export class Param{
	// name, type
	static parse( dom){
		throw new TypeError("Param is virtual")
	}
	constructor( opts){
		Object.assign( this, opts)
	}
}

export class Arg extends Param{
	static parse( dom, klass, tag){
		if( dom.tagname!== (tag|| "arg")){
			throw new typeerror("Incorrect tag")
		}
		var name= dom.getAttribute( "name")
		var type= dom.getAttribute( "type")
		klass= klass|| Arg
		return new klass({ name, type})
	}
}

export class Member{
	static parse( dom, klass, tag){
		if( !tag|| dom.tagName!== tag){
			throw new typeerror("Incorrect tag")
		}
		var name= dom.getAttribute( "name")
		return new klass({ name})
	}	
}

export class Method extends Member{
	// name, [arg]
	static parse( dom){
		if( dom.tagName!== "method"){
			throw new TypeError("Incorrect tag")
		}
		var name= dom.getAttribute( "name")
		var arg= dom.querySelectorAll( "arg").map( MethodArg.parse)
		return new Method({ name, arg})
	}
	constructor( opts){
		Object.assign( this, opts)
	}

}

export class MethodArg extends Arg{
	// +direction
	static parse( dom){
		var data= Arg.parse( dom, MethodArg)
		data.direction= dom.getAttribute( "direction")
		return data
	}
}

export class Property extends Member{
	// name, type, access
	static parse( dom){
		var data= Param.parse( dom, Property, "property")
		data.access= dom.getAttribute( "access")
		return new data
	}
}

export class Signal extends Member{
	// name, [arg]
	static parse( dom){
		var name= dom.getAttribute( "name")
		var arg= dom.querySelectorAll( "arg").map( SignalArg.parse)
		return new Signal({ name, arg})
	}
	constructor( opts){
		Object.assign( this, opts)
	}

}

export class SignalArg extends Arg{
	// +
	constructor( opts){
		Object.assign( this, opts)
	}

}

