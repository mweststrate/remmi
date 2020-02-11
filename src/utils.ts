const hasSymbol = typeof Symbol !== "undefined"

// TODO: force else branch for testing purposes
export const iteratorSymbol: typeof Symbol.iterator = hasSymbol
	? Symbol.iterator
	: ("@@iterator" as any)

/* istanbul ignore next */
let extendStatics = function(d: any, b: any): any {
	extendStatics =
		Object.setPrototypeOf ||
		({__proto__: []} instanceof Array &&
			function(d, b) {
				d.__proto__ = b
			}) ||
		function(d, b) {
			for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]
		}
	return extendStatics(d, b)
}

// Ugly hack to resolve Immer #502 and inherit built in Map / Set
export function __extends(d: any, b: any): any {
	extendStatics(d, b)
	function __(this: any): any {
		this.constructor = d
	}
	d.prototype =
		// @ts-ignore
		((__.prototype = b.prototype), new __())
}

export function setsAreEqual(set1: Set<any>, set2: Set<any>) {
	if (set1.size !== set2.size)
		return false
	const it1 = set1[Symbol.iterator]()
	const it2 = set2[Symbol.iterator]()
	let a: IteratorResult<any>
	while(true) {
		a = it1.next()
		if (a.done)
			return true;
		if (a.value !== it2.next().value)
			return false;
	} 
}
