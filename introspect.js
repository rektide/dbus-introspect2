import allInAll from "all-in-all"
import basichtml from "basichtml"
import Dbus from "./dbus.js"
import promisify from "es6-promisify"

const Document= basichtml.Document

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
	  serviceName= opts.service,
	  _service= opts.dbus.getService( serviceName),
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
		var introspect= iface.then( async function( iface){
			// remember path
			iface.path= path
			// read introspection doc in
			var
			  intr= promisify( iface.Introspect, iface)(),
			  doc= new Document(),
			  got= await intr
			doc.body.innerHTML= got
			var interfacesArray= doc.documentElement.querySelectorAll("interface").map( Interface.parse)
			var interfaces= interfacesArray.reduce(( acc, cur)=> (acc[ cur.name]= cur, cur.path= path, cur), {})
			var result= {
				name: serviceName,
				path,
				interfaces
			}
			opts.result[ path]= result

			// follow all node links
			var nodes= doc.documentElement.querySelectorAll( "node")
			nodes.forEach( node=> addPath( node.getAttribute("name"), path))
		})
		all.push( introspect)
		return introspect
	}
	addPath( opts.path)
	return allInAll( all).then( ()=> opts.result)
}
export default introspect

export class Interface{
	static parse( dom, path){
		// name, path, dom
		var name= dom.getAttribute( "name")
		// read methods
		var method= dom.querySelectorAll("method").map( Method.parse)
		// read properties
		var property= dom.querySelectorAll("property").map( Property.parse)
		// read signals
		var signal= dom.querySelectorAll("signal").map( Signal.parse)
		var result= {
			name,
			path,
			method,
			property,
			signal
		}
		return new Interface( result)
	}
	constructor( opts){
		Object.assign( this, opts)
	}
	// name, path, method, property, signal
}

export class Param{
	// name, type
	static parse( dom, klass, tag){
		if( !tag|| !klass){
			throw new TypeError("Param is virtual")
		}
		var name= dom.getAttribute( "name")
		var type= dom.getAttribute( "type")
		return new klass({ name, type})
	}
	constructor( opts){
		Object.assign( this, opts)
	}
}

export class Arg extends Param{
	static parse( dom, klass, tag){
		if( dom.tagName!== (tag|| "arg")){
			throw new TypeError("Incorrect tag")
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
	constructor( opts){
		Object.assign( this, opts)
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
		return data
	}
}

export class Signal extends Member{
	// name, [arg]
	static parse( dom){
		var name= dom.getAttribute( "name")
		var arg= dom.querySelectorAll( "arg").map( SignalArg.parse)
		return new Signal({ name, arg})
	}
}

export class SignalArg extends Arg{
	static parse( dom){
		return Arg.parse( dom, SignalArg)
	}
	// +
}

