cheerio = require('cheerio');
request = require('request');
fs = require('fs');

baseUrl = "https://nces.ed.gov/collegenavigator/";
searchUrl = "https://nces.ed.gov/collegenavigator/?s=AR+CO+GA+ID+IL+IN+IA+KS+KY+MI+MN+MS+MO+MT+NE+NV+NC+ND+OH+OK+OR+PA+SC+SD+TN+UT+VA+WA+WV+WI+WY&p=40.0801&ic=1";

major = "Physics, General"

n = 1;
o = 31;
collegeUrls = [];
contents = fs.readFileSync("collegeUrls.txt");

output = [];
parsed = false;
if (!contents || contents == null || contents === "" || contents == "") {
    parseResults();
} else {
    collegeUrls = JSON.parse(contents);
    console.log("Loaded " + collegeUrls.length + " colleges from collegeUrls.txt!");
    parseCollegeUrls();
    parsed = true;
    //console.log(collegeUrls);
}

function parseResults() {
    if (parsed) return;
    request(searchUrl + "&pg=" + n, function(error, response, body) {
        page = cheerio.load(body);

        page("#ctl00_cphCollegeNavBody_ucResultsMain_tblResults").find("a").each(function(index, element) {
            if (!page(this).attr('href').includes("id")) return;
            collegeUrls.push(page(this).attr('href'))
        });
        if (n < o) {
            n++;
            parseResults();
        } else {
            console.log(collegeUrls.length + " schools ready to parse individually.");
            parsed = true;
            console.log("Saving colleges to collegeUrls.txt");
            fs.writeFile(

                './collegeUrls.txt',

                JSON.stringify(collegeUrls),

                function(err) {
                    if (err) {
                        console.error(err);
                    }
                }
            );
            parseCollegeUrls();
        }
    })
}

parseResults();

function parseCollegeUrls() {
    done = 0;
    recurses = 0;
    for (index = 0; index < collegeUrls.length; index++) {
        //console.log("Requesting " + baseUrl + collegeUrls[index]);
        request({ url: "" + baseUrl + collegeUrls[index] }, function(error, response, body) {
            if (body == null || !body) {
                done++;
                return;
            }

            $ = cheerio.load(body);

            school = $("span.headerlg").text();

            console.log("Parsing " + school + " page for " + major);
            done++;
            $("#divctl00_cphCollegeNavBody_ucInstitutionMain_ctl07 table").find("tr").each(function(index, element) {
                if ($(this).find("td").eq(0).text() == major) {

                    number = $(this).find("td").eq(1).text().replace("-", "0");
                    console.log(number);
                    output.push(school + ", " + number)

                }
            })
        });

    }
    lastValue = -1;
    setInterval(function() {
        recurses++;

        console.log(done + " colleges parsed.");

        if (lastValue == done && recurses > 3 && done != 0) {
            console.log("Taking too long; skipping the last " + (collegeUrls.length - done) + " schools.");


            console.log(" ");
            output.forEach(function(value, index, array) {
                console.log(value);
            });

            console.log("Saved to output.txt");
            fs.writeFile("output.txt", output.join("\n"), function(err) {
                console.log(err)
            });

            process.exit(0);
        }

        lastValue = done;
    }, 10000);
}