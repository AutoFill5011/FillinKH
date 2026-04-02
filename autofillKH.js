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

let timestamp=prompt("Thời gian của tờ khai");

if(!timestamp){
alert("Missing input");
return;
}

// convert timestamp
//function convertFormat(input){
//const [datePart,timePart]=input.split(" ");
//const [day,month,year]=datePart.split("/");
//return `${month}/${day}/${year} ${timePart}`;
//}

//let convertedTimestamp=convertFormat(timestamp);

// find matching row
let match=rows.find(r=>
r[0] && r[0].trim()==timestamp
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
// Wife's Ethnicity
// ========================
let wifeethnicityRaw = match[8];

// normalize base
let wifeethnicity = wifeethnicityRaw
    .replace(/"/g,"")
    .replace(/\r/g,"")
    .trim()
    .toLowerCase();

// remove accents for comparison
function removeAccent(str){
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

let wifenormalized = removeAccent(wifeethnicity);

// map to correct official values
let wifeethnicityMap = {
    "kinh": "Kinh",
    "tay": "Tay",
    "nung": "Nùng",
    "muong": "Mường",
    "san diu": "Sán Dìu",
    "thai": "Thái"
};

wifeethnicity = wifeethnicityMap[wifenormalized] || wifeethnicity;

// use EXACT match now (safe)
await selectDropdown(15, wifeethnicity, true);

// ========================
//Wife's place status
// ========================
await selectDropdown(19,"nơi",false);

// ========================
// WIFE ADDRESS
// ========================
function formatAddress(str){

return str
    .toLowerCase() // normalize everything first
    .split(" ")
    .map(word => {

        // keep numbers or mixed like 2-2-22 unchanged
        if(/^[0-9\-]+$/.test(word)){
            return word;
        }

        // capitalize first letter only
        return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

let wifeAddr1 = match[10]
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

let wifeAddress = formatAddress(wifeAddr1);

visible[22].value = wifeAddress;
visible[22].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
// WIFE LEGAL DOCUMENT
// ========================

await selectDropdown(23,"hộ",false);

function convertDateDMYtoInput(dateStr){

let cleaned = dateStr
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

let parts = cleaned.split("/");

if(parts.length !== 3){
return cleaned;
}

let day = parseInt(parts[0]);
let month = parseInt(parts[1]);
let year = parts[2];

// force 2-digit format
day = String(day).padStart(2,"0");
month = String(month).padStart(2,"0");

return day + month + year; // ddmmyyyy
}
    
function extractPassportInfo(raw){

let text = raw
    .replace(/"/g,"")
    .replace(/\r/g,"")
    .trim();

// ========================
// 1. WIFE PASSPORT NUMBER
// ========================
let passportMatch = text.match(/\b(?=[A-Z0-9]*\d{3,})(?=.*[A-Z])[A-Z0-9]{5,}\b/i);
let passport = passportMatch ? passportMatch[0] : "";

if(/^\d+$/.test(passport)){
    passport = "";
}

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
    .replace(/cấp ngày:/i, "")
    .replace(/ngày/i, "")
    .replace(/ngày:/i, "")
    .replace(/do/i, "")
    .replace(/hộ chiếu/i, "")
    .replace(/hộ chiếu:/i, "")
    .replace(/hc số/i, "")
    .replace(/số/i, "")
    .replace(/cấp/i, "")
    .replace(/nơi cấp/i, "")
    .replace(/:/i, "")
    .replace(/./i, "")
    .replace(/,/i, "")
    .replace(/-/i, "")
    .replace(/_/i, "")
    .replace(/. Nơi :/i, "")
    .replace(/Nơi/i, "")
    .replace(/Nơi:/i, "")
    .replace(/nơi/i, "")
    .replace(/nơi:/i, "")
    .replace(/. Ngày cấp:/i, "")
    .replace(/ngày cấp:/i, "")
    .replace(/ngày cấp/i, "")
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

//alert(
//"Passport: " + wifeinfo.passport +
//"\nDate: " + wifeinfo.date +
//"\nPlace: " + wifeinfo.place
//);

// ========================
// WIFE FIELD 24: PASSPORT NUMBER
// ========================
visible[24].value = wifeinfo.passport;
visible[24].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
// WIFE FIELD 25: DATE (convert to ddmmyyyy for picker)
// ========================
let wifeformattedDate = convertDateDMYtoInput(wifeinfo.date);

visible[25].focus();
visible[25].value = wifeformattedDate;
visible[25].dispatchEvent(new Event("input",{bubbles:true}));
visible[25].dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));

// ========================
// WIFE FIELD 26: PLACE
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

// ========================
// HUSBAND NAME SPLIT
// ========================

let husbandfullNameRaw = match[15];   // column containing full name

// clean name
let husbandfullName = husbandfullNameRaw
    .replace(/"/g,"")
    .replace(/\r/g,"")
    .trim();

let husbandnameParts = husbandfullName.split(/\s+/);

if(husbandnameParts.length < 2){
    alert("Name format error");
    return;
}

// assign parts
let husbandsurname = husbandnameParts[0];
let husbandfirstName = husbandnameParts[husbandnameParts.length - 1];
let husbandmiddleName = husbandnameParts.slice(1, -1).join(" ");

// surname
visible[29].value = husbandsurname;
visible[29].dispatchEvent(new Event("input",{bubbles:true}));

// middle name(s)
visible[30].value = husbandmiddleName;
visible[30].dispatchEvent(new Event("input",{bubbles:true}));

// first name
visible[31].value = husbandfirstName;
visible[31].dispatchEvent(new Event("input",{bubbles:true}));
    
// ========================
// HUSBAND DATE OF BIRTH
// ========================

let husbanddobRaw = match[16];

// clean
let husbanddob = husbanddobRaw
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

// split
let husbandparts = husbanddob.split("/");

let husbandMonth = parseInt(husbandparts[0]).toString();
let husbandDay = parseInt(husbandparts[1]).toString();
let husbandYear = husbandparts[2];

// ========================
//husband's Day
await selectDropdown(32,husbandDay,false);

// ========================
//husband's Month
await selectDropdown(33,husbandMonth,false);

// ========================
//husband's Year
visible[34].value = husbandYear;
visible[34].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
//husband's place
// ========================
await selectDropdown(38,"nhật",false);

// ========================
// Wife's Ethnicity
// ========================
let husbandethnicityRaw = match[17];

// normalize base
let husbandethnicity = husbandethnicityRaw
    .replace(/"/g,"")
    .replace(/\r/g,"")
    .trim()
    .toLowerCase();

// remove accents for comparison
function removeAccent(str){
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

let husbandnormalized = removeAccent(husbandethnicity);

// map to correct official values
let husbandethnicityMap = {
    "kinh": "Kinh",
    "tay": "Tay",
    "nung": "Nùng",
    "muong": "Mường",
    "san diu": "Sán Dìu",
    "thai": "Thái"
};

husbandethnicity = husbandethnicityMap[husbandnormalized] || husbandethnicity;

// use EXACT match now (safe)
await selectDropdown(35, husbandethnicity, true);

// ========================
//husband's place status
// ========================
await selectDropdown(39,"nơi",false);

// ========================
// HUSBAND ADDRESS
// ========================
let husbandAddr1 = match[19]
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

let husbandAddress = formatAddress(husbandAddr1);

visible[42].value = husbandAddress;
visible[42].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
// HUSBAND LEGAL DOCUMENT
// ========================

await selectDropdown(43,"hộ",false);

let husbanddocRaw = match[20];

let husbandinfo = extractPassportInfo(husbanddocRaw);

//alert(
//"Passport: " + husbandinfo.passport +
//"\nDate: " + husbandinfo.date +
//"\nPlace: " + husbandinfo.place
//);

// ========================
// HUSBAND: PASSPORT NUMBER
// ========================
visible[44].value = husbandinfo.passport;
visible[44].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
// HUSBAND: DATE (convert to ddmmyyyy for picker)
// ========================
let husbandformattedDate = convertDateDMYtoInput(husbandinfo.date);

visible[45].focus();
visible[45].value = husbandformattedDate;
visible[45].dispatchEvent(new Event("input",{bubbles:true}));
visible[45].dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));

// ========================
// HUSBAND: PLACE
// ========================
visible[46].value = husbandinfo.place;
visible[46].dispatchEvent(new Event("input",{bubbles:true}));

// ========================
//Registered Place
// ========================
await selectDropdown(69,"nhật",false);

let registeredNumber = match[26];
visible[70].value = registeredNumber;
visible[70].dispatchEvent(new Event("input",{bubbles:true}));

let registeredNumber = match[25];
visible[71].value = registeredNumber;
visible[71].dispatchEvent(new Event("input",{bubbles:true}));

function convertDate(date){

let convert = date
.replace(/"/g,"")
.replace(/\r/g,"")
.trim();

let part = convert.split("/");

if(part.length !== 3){
return convert;
}

let d = parseInt(part[1]);
let m = parseInt(part[0]);
let y = part[2];

// force 2-digit format
d = String(d).padStart(2,"0");
m = String(m).padStart(2,"0");

return d + m + y; // ddmmyyyy
}

let registeredDate = convertDate(match[27]);

visible[72].focus();
visible[72].value = registeredDate;
visible[72].dispatchEvent(new Event("input",{bubbles:true}));
visible[72].dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
    
alert("Điền form thành công!!!");
})();
