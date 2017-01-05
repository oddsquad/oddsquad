module.exports = function(res, data, util) {
	if(data.fields.id in data.CARD_DATA) {
		util.die(200, JSON.stringify(data.CARD_DATA[data.fields.id].rawData), "application/json");
	}
	else {
		util.die(404, "No such card");
	}
};
