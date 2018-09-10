const dataObj = {'nissar': ['hubert', 'skuldbert', 'dyngbert']};

if (typeof document === 'object') {
	function addPlutt() {
		dataObj.nissar.push('hoho');
		setTimeout(addPlutt, 2000);
	}
	setTimeout(addPlutt, 2000);
}

export function data() {
	return dataObj;
}

export const computed = {
	'bork': function () {
		return 'bork';
	}
}

export const methods = {
	'somestuff': function () {
		alert('WAFF');
	}
};

export function mounted() {
	console.log('ALL IS WELL!');
}