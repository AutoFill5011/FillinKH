javascript:(async function(){

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

// ========================
//Working dropdown select
// ========================
async function selectDropdown(index,value,exact=true){

let field=visible[index];

if(!field){
alert("Input "+index+" not found");
return;
}

field.focus();
field.click();

// type value to filter dropdown
field.value=value;
field.dispatchEvent(new Event("input",{bubbles:true}));

await sleep(500);

let options=document.querySelectorAll(".vts-select-item-option");

let target=null;

options.forEach(o=>{

let text=o.innerText.trim();

if(exact){

if(text==value){
target=o;
}

}else{

// numeric safe comparison (fixes 2→02 and prevents 3→30)
if(!isNaN(value) && parseInt(text)==parseInt(value)){
target=o;
}

// normal text partial match (Nhật → Nhật Bản)
else if(isNaN(value) && text.toLowerCase().includes(value.toLowerCase())){
target=o;
}

}

});

if(!target){
alert("Dropdown value '"+value+"' not found at input "+index);
return;
}

target.click();
}

    
// ========================
// LOAD GOOGLE SHEET
// ========================
const sheetID="1v7eZ2Q-1FKV_ysfZCEKZ99gXQjG1YL3OBcguC-Bn9m4";
const sheetURL=`https://docs.google.com/spreadsheets/d/${sheetID}/export?format=csv`;

let response=await fetch(sheetURL);
let csv=await response.text();

function parseCSV(text){

const rows=[];
let row=[];
let value='';
let insideQuotes=false;

for(let i=0;i<text.length;i++){

const char=text[i];
const next=text[i+1];

if(char=='"' && insideQuotes && next=='"'){
value+='"';
i++;
}

else if(char=='"'){
insideQuotes=!insideQuotes;
}

else if(char==',' && !insideQuotes){
row.push(value);
value='';
}

else if((char=='\n'||char=='\r') && !insideQuotes){
if(value!==''||row.length){
row.push(value);
rows.push(row);
row=[];
value='';
}
}

else{
value+=char;
}

}

if(value!==''){
row.push(value);
rows.push(row);
}

return rows;
}

let rows=parseCSV(csv).slice(1);

let timestamp=prompt("Enter timestamp (d/m/yyyy hh:mm:ss)");

if(!timestamp){
alert("Missing input");
return;
}

// convert timestamp
function convertFormat(input){
const [datePart,timePart]=input.split(" ");
const [day,month,year]=datePart.split("/");
return `${month}/${day}/${year} ${timePart}`;
}

let convertedTimestamp=convertFormat(timestamp);

// find matching row
let match=rows.find(r=>
r[0] && r[0].trim()==convertedTimestamp
);

if(!match){
alert("No matching record found");
return;
}


    
// ========================
// WIFE NAME SPLIT
// ========================

let wifefullNameRaw = match[6];   // column containing full name

// clean name
let wifefullName = wifefullNameRaw
    .replace(/"/g,"")
    .replace(/\r/g,"")
    .trim();

let wifenameParts = wifefullName.split(/\s+/);

if(wifenameParts.length < 2){
    alert("Name format error");
    return;
}

// assign parts
let wifesurname = wifenameParts[0];
let wifefirstName = wifenameParts[wifenameParts.length - 1];
let wifemiddleName = wifenameParts.slice(1, -1).join(" ");

// ========================
// FILL FORM INPUTS
// ========================

let elements=document.querySelectorAll("input,select,textarea");
let visible=[];

elements.forEach(el=>{
if(el.offsetParent!==null) visible.push(el);
});

// surname
visible[9].value = wifesurname;
visible[9].dispatchEvent(new Event("input",{bubbles:true}));

// middle name(s)
visible[10].value = wifemiddleName;
visible[10].dispatchEvent(new Event("input",{bubbles:true}));

// first name
visible[11].value = wifefirstName;
visible[11].dispatchEvent(new Event("input",{bubbles:true}));
    
// ========================
// WIFE DATE OF BIRTH
// ========================

let wifedobRaw = match[7];

// clean
let wifedob = wifedobRaw
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

// split
let wifeparts = wifedob.split("/");

let wifeMonth = parseInt(wifeparts[0]).toString();
let wifeDay = parseInt(wifeparts[1]).toString();
let wifeYear = wifeparts[2];

// ========================
//Wife's Day
await selectDropdown(12,wifeDay,false);

// ========================
//Wife's Month
await selectDropdown(13,wifeMonth,false);

// ========================
//Wife's Year
visible[14].value = wifeYear;
visible[14].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
//Wife's place
// ========================
await selectDropdown(18,"nhật",false);

// ========================
//Wife's Ethnicity
// ========================
let wifeethnicityRaw = match[8];

let wifeethnicity = wifeethnicityRaw
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

// special conversion
if(wifeethnicity === "Tày"){
wifeethnicity = "Tay";
}

// type to filter
await selectDropdown(15,wifeethnicity,true);

// ========================
//Wife's place status
// ========================
await selectDropdown(19,"nơi",false);

// ========================
// WIFE ADDRESS
// ========================

let wifeAddr1 = match[10]
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

let wifeAddress = wifeAddr1;

visible[22].value = wifeAddress;
visible[22].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
// WIFE LEGAL DOCUMENT
// ========================

await selectDropdown(23,"hộ",false);

function extractPassportInfo(raw){

let text = raw
    .replace(/"/g,"")
    .replace(/\r/g,"")
    .trim();

// ========================
// 1. PASSPORT NUMBER
// ========================
// find something like C123456 or MK154125
let passportMatch = text.match(/\b(?=[A-Z0-9]*\d{3,})(?=.*[A-Z])[A-Z0-9]{5,}\b/i);
let passport = passportMatch ? passportMatch[0] : "";

// ========================
// 2. DATE
// ========================
let dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
let date = dateMatch ? dateMatch[0] : "";

// ========================
// 3. PLACE
// ========================
// remove passport + remove date
let place = text
    .replace(passport, "")
    .replace(date, "")
    .replace(/cấp ngày/i, "")
    .replace(/do/i, "")
    .replace(/hộ chiếu/i, "")
    .replace(/hc số/i, "")
    .trim();

// clean extra spaces
place = place.replace(/\s+/g," ").trim();

return {
    passport,
    date,
    place
};
}
    
let wifedocRaw = match[11];

let wifeinfo = extractPassportInfo(wifedocRaw);

alert(
"Passport: " + wifeinfo.passport +
"\nDate: " + wifeinfo.date +
"\nPlace: " + wifeinfo.place
);

// ========================
// FIELD 24: PASSPORT NUMBER
// ========================
visible[24].value = wifeinfo.passport;
visible[24].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
// FIELD 25: DATE (convert to ddmmyyyy for picker)
// ========================
let wifeformattedDate = convertDateMDYtoInput(wifeinfo.date);

visible[25].focus();
visible[25].value = wifeformattedDate;
visible[25].dispatchEvent(new Event("input",{bubbles:true}));
visible[25].dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));

// ========================
// FIELD 26: PLACE
// ========================
visible[26].value = wifeinfo.place;
visible[26].dispatchEvent(new Event("input",{bubbles:true}));
    
// helper to clean text
function cleanText(v){
return v
.replace(/"/g,"")
.replace(/\r/g,"")
.trim()
.toLowerCase();
}
    
function convertDateMDYtoInput(dateStr){

let cleaned = dateStr
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

let parts = cleaned.split("/");

if(parts.length !== 3){
return cleaned;
}

let month = parseInt(parts[0]);
let day = parseInt(parts[1]);
let year = parts[2];

// force 2-digit format
month = String(month).padStart(2,"0");
day = String(day).padStart(2,"0");

return day + month + year;
}  

alert("Điền form thành công!!!");
})();
