import dbus from "dbus-native"

export function system(){
	return dbus.systemBus()
}
export function session(){
	return dbus.sessionBus()
}

let _default= session
export default function(){
	return _default()
}

export function setDefault( de_fault){
	_default= de_fault
}
