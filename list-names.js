import Dbus from "./dbus.js"
import Interface from "./interface.js"

export async function listNames( opts){
	var
	  bus= opts&& opts.dbus|| Dbus(),
	  manager= await Interface( bus, "org.freedesktop.DBus", "/org/freedesktop/DBus", "org.freedesktop.DBus"),
	  // lol this is built into dbus-native bus oh well
	  names= await manager.ListNames()
	return names
}
export default listNames;
