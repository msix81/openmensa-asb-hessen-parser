/**
 * Parser to parse menus from ASB Hessen website (https://www.menuebestellung.de/asb-heserv) and convert into OpenMensa format (http://openmensa.org/open-mensa-v2).
 */

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/** 
 * Offers endpoint with XML feed.
 * 
 * @param menuDate Parseable date (e.g. yyyy-mm-dd) for when to fetch the menu
 * @param school id of the school to fetch the menu for, see source url
 */
exports.getMenu = (req, res) => {
	var menuDate = req.query.menuDate ? new Date(Date.parse(req.query.menuDate)) : new Date();
	var school = req.query.school ? req.query.school : 1;
	var sourceUrl = 'https://www.menuebestellung.de/asb-heserv/timetable_public.php?week=' + menuDate.getFullYear() + '_' + menuDate.getWeekNumber() + '&school=' + school;

	var response = '';
	var meals = {};

	// fetch data from source
	JSDOM.fromURL(sourceUrl, {}).then(dom => {
		
		// parse meals
		var weekDayElmIds = ['#day-MO', '#day-DI', '#day-MI', '#day-DO', '#day-FR'];
		var mondayDate = menuDate.getMonday();
		weekDayElmIds.forEach(function (weekDayElmId, i) {
			var mealsOfOneDay = parseMealsOfOneDay(dom.window.document.querySelector(weekDayElmId));
			var dateOfWeekDay = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + i);
			
			meals[dateOfWeekDay.yyyymmdd()] = mealsOfOneDay;
		});
		
		// build response
		res
			.setHeader('content-type', 'text/xml')
			.status(200)
			.send(
				'<?xml version="1.0" encoding="UTF-8"?>\n'
				+ '<openmensa version="2.1" xmlns="http://openmensa.org/open-mensa-v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://openmensa.org/open-mensa-v2 http://openmensa.org/open-mensa-v2.xsd"><version>0.0.2</version>' 
				+ '<canteen>' + formatMealsInXml(meals) + '</canteen>'
				+ '</openmensa>'
			);
	});
};

/** 
 * Parses a single day's DOM and extracts the meals.
 */
function parseMealsOfOneDay(oneDayDom) {
	var mealsOfOneDay = {};
	oneDayDom.querySelectorAll('.menue').forEach(function (elm, i) {
		var food = elm.querySelector('.panel-body') && elm.querySelector('.panel-body').textContent.trim()
			.replace(/(((EI|FI|GL|LA|SD|SL|SO|S|1|3|5|8|9)(,|$))*)/gm, '')
			.replace(/\n+/gm, ', ')
			.replace(/, +,/gm, '')
			.trim();
		var type = elm.querySelector('.panel-heading') && elm.querySelector('.panel-heading').textContent.trim();
		if ((food.length > 0) && (type.length > 0)) {
		  mealsOfOneDay[type] = food;
		}
	});
	
	return mealsOfOneDay;
}

/**
 * Format the meals array into Openmensa XML.
 */
function formatMealsInXml(meals) {
	var xml = '';
	Object.keys(meals).forEach(function(date, i) {
		xml += '<day date="' + date + '">';

		var mealsOfOneDay = meals[date];
		var mealTypesOfOneDay = Object.keys(mealsOfOneDay);
		if (mealTypesOfOneDay.length > 0) {
			mealTypesOfOneDay.forEach(function(type, i) {
				xml += '<category name="' + type + '">';
				xml += '<meal><name>' + mealsOfOneDay[type] + '</name></meal>';
				xml += '</category>';
			});
		} else {
			xml += '<closed/>'
		}
		xml += '</day>';
	});
	
	return xml;
}

/** 
 * Calculates ISO week number.
 * Courtesy https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
 */
Date.prototype.getWeekNumber = function(){
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

/**
 * Calculates the Monday date of the same week as the given date.
 */
Date.prototype.getMonday = function(){
  var deltaToMonday = this.getDate() - this.getDay() + (this.getDay() == 0 ? -6 : 1);
  return new Date(this.setDate(deltaToMonday));
};

/**
 * Reformats a date into yyyy-mm-dd.
 */
Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1;
  var dd = this.getDate();

  return [this.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
};