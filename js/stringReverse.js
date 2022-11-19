const date = '2019-08-04T17:46:14.232Z';
console.log(date);

const dateReverse = (data) => {
	// take a substring of the data - optional
	let getDate = data.substring(2, 10);
	console.log(getDate);
	// split the string where you need it. To break every character use ""
	let splitDate = getDate.split('-');
	console.log(splitDate);
	// reverse the array created in the previous line
	let reverseDate = splitDate.reverse();
	console.log(reverseDate);
	// join the array back together using the chosen delimiter. Use "/" gives DD/MM/YY in this example
	let joinDate = reverseDate.join('/');
	console.log(joinDate);

	return joinDate;
};

dateReverse(date);
