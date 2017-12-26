import promisify from "es6-promisify"

var builtins= [ "on", "addListener", "removeListener"]

export default async function( dbus, serviceName, path, interfaceName){
	var
	  service= dbus.getService( serviceName),
	  getInterface= promisify( service.getInterface, service),
	  underlying= await getInterface( path, interfaceName),
	  props= {}
	for( var i of builtins){
		props[ i]= {
			value: underlying[ i].bind( underlying),
			enumerable: false
		}
	}
	for( var i in underlying){
		if( builtins.indexOf( i)!== -1){
			continue
		}
		if( !(underlying[ i] instanceof Function)){
			continue
		}
		props[ i]= {
			value: promisify( underlying[ i], underlying),
			enumerable: true
		}
	}
	// can't modify original, so built a wrapper object with promises
	return Object.defineProperties({}, props)
}
