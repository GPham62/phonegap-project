function populateDB(tx) {
    //create restaurants table
    tx.executeSql('DROP TABLE IF EXISTS restaurants');
    tx.executeSql('CREATE TABLE IF NOT EXISTS restaurants (res_id integer primary key not null, res_name text not null, type text, price text, service text, cleanliness text, quality text, visited_time text, imageURI text)');
    //insert restaurant
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("Via Spohia", "Grill", "low", "okay", "okay","okay", "6PM 1/2/2020", "img/res1.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("Pinky Cafe", "Sea Food", "average", "good", "good","excellent", "6PM 2/3/2020", "img/res2.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("Dorechester", "Grill", "high", "good", "good","excellent", "6PM 3/4/2020", "img/res3.png")');
    //create note table
    tx.executeSql('DROP TABLE IF EXISTS notes');
    tx.executeSql('CREATE TABLE IF NOT EXISTS notes (note_id integer primary key not null,content text not null,user_name text not null, res_id integer not null, foreign key (res_id) references restaurants (res_id) on update cascade on delete cascade)');
    //insert note
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Pham", 1)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Minh", 2)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Huy", 1)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Linh", 2)')
}
function errorCB(tx, err) {
    console.log("SQL Error: " + err);
}
function successCB() {

}
function renderAllRes(tx) {
    tx.executeSql('select * from restaurants', [], function (t, rs) {
        for (let i = 0; i < rs.rows.length; i++) {
            let { res_id, res_name, imageURI } = rs.rows.item(i);
            addRes(res_id, res_name, imageURI)
        }

        $("#restaurantList").listview('refresh')
        
        $(".showResDetails").on('click', function (e) {
            let resId = $(this).attr('res-id')
            $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${resId}` });
        })
    })
}
//convert rating from string to number 
function convertToNumber(ratingStr) {
    switch(ratingStr){
        case "improve":
            return 1;
        case "okay":
            return 2;
        case "good":
            return 3;
        case "excellent":
            return 4;
    }
}
//calculate the average rating based on service, cleanliness and quality
function calcAverageRating(serviceStr, cleanlinessStr, qualityStr) {
    let serviceNum = convertToNumber(serviceStr)
    let cleanlinessNum = convertToNumber(cleanlinessStr)
    let qualityNum = convertToNumber(qualityStr)
    let ratingAverage = Math.floor((serviceNum + cleanlinessNum + qualityNum)/3);
    return ratingAverage;
}
function takePhoto() {
    navigator.camera.getPicture(takePhotoSuccess, takePhotoError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        correctOrientation: true
    })
}
function takePhotoSuccess(imageURI) {
    var img = document.getElementById('image');
    img.src = imageURI;
}
function takePhotoError(message) {
    console.log("Camera error: "+ message);
}
function addNote(reviewerName, note) {
    $("#noteList").append(
        `<label for="user1">${reviewerName}</label>` +
        `<textarea name="user1" cols="40" rows="5" readonly>${note}</textarea>`
    )
}
function addRes(resId, resName, imageURI) {
    $("#restaurantList").append(
        '<li data-theme="c">' +
        `<a class="showResDetails" data-transition="slide" res-id=${resId}>` +
        `<img src=${imageURI}>` +
        `<h2>${resName}</h2>` +
        '</a>' +
        '</li>'
    )
}
function deleteRes(resId) {
    var a_res_id = document.querySelector(`a[res-id="${resId}"]`);
    a_res_id.closest('li').remove();
}
function saveNote(db, reviewerName, note, resId) {
    db.transaction(function (tx) {
        tx.executeSql(`insert into notes(content, user_name, res_id) values ("${note}", "${reviewerName}", "${resId}")`)
        addNote(reviewerName, note)
    }, errorCB, successCB)
}

$(document).ready(function () {
    //connect database
    var db = window.openDatabase("Database", "1.0", "Cordova Demo", 3000000);

    //create database
    db.transaction(populateDB, errorCB, successCB);

    //render all restaurants
    db.transaction(renderAllRes, errorCB, successCB)

    //render restaurant details
    $(document).on('pagebeforeshow', "#resDetails", function (e, d) {
        let param = window.location.href.split("?")[1]
        let resId = param.replace("resId=", "");
        db.transaction(function (tx) {
            tx.executeSql(`select * from restaurants left join notes on restaurants.res_id = notes.res_id where restaurants.res_id=${resId}`, [], function (t, rs) {
                $("#noteList").empty();
                for (let i = 0; i < rs.rows.length; i++) {
                    if (i == 0) {
                        let { price, quality, res_name, service, cleanliness, type, visited_time, imageURI } = rs.rows.item(i)
                        
                        $('.infoResName').text(res_name)
                        $('.infoResType').text(type)
                        $('.infoResPrice').text(`${price}`)
                        $('.infoResRating').text(calcAverageRating(service, cleanliness, quality))
                        $('.infoResVisit').text(visited_time)
                        $('#currentResId').val(resId)
                        $("#res-img").attr("src", imageURI)
                    }
                    let { user_name, content, note_id } = rs.rows.item(i)
                    if (note_id != null) {
                        addNote(user_name, content)
                    }
                }
            })
        }, errorCB, successCB)
    });

    $("#takepicture").on('click', function () {
        takePhoto();
    })

    $("#newNoteForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            note: {
                required: true
            }
        },
        messages: {
            reviewerName: {
                required: "Required!",
            },
            note: {
                required: "Required!",
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (f) {
            let reviewerName = $('#newNoteForm input[name="reviewerName"]').val();
            let note = $('#newNoteForm textarea[name="note"]').val();
            let res_id = $("#currentResId").val()
            saveNote(db, reviewerName, note, res_id)

            //clear newNoteForm inputs
            $('#newNoteForm input[name="reviewerName"]').val("");
            $('textarea#new-note-textarea').val("");

            //close newNoteForm 
            $("#newNoteForm-close").trigger("click");

            return false;
        }
    });

    //validator
    $.validator.addMethod("valueNotEquals", function (value, element, arg) {
        return arg !== value;
    }, "Value must not equal arg!");


    //anh sửa delete btn nhé
    $("#delResBtn").on("click", function () {
        let res_id = $("#currentResId").val()
        db.transaction(function (tx) {
            tx.executeSql(`delete from restaurants where restaurants.res_id=${res_id}`)
            tx.executeSql(`delete from notes where notes.res_id=${res_id}`)
            deleteRes(res_id);
        }, errorCB, successCB)
    })

    $("#newResForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            restaurantName: {
                required: true
            },
            visitTime: {
                required: true
            },
            visitDate: {
                required: true
            },
            restaurantPrice: {
                valueNotEquals: "default"
            },
            restaurantType: {
                valueNotEquals: "default"
            },
            restaurantService: {
                valueNotEquals: "default"
            },
            restaurantClean: {
                valueNotEquals: "default"
            },
            foodQuality: {
                valueNotEquals: "default"
            }
        },
        messages: {
            reviewerName: {
                required: "Your name required!",
            },
            restaurantName: {
                required: "Restaurant name required!",
            },
            visitTime: {
                required: "Visit time required!",
            },
            visitDate: {
                required: "Visit date required!",
            },
            restaurantPrice: {
                valueNotEquals: "Price required!",
            },
            restaurantType: {
                valueNotEquals: "Type required!"
            },
            restaurantService: {
                valueNotEquals: "Service rating required!"
            },
            restaurantClean: {
                valueNotEquals: "Cleanliness rating required!"
            },
            foodQuality: {
                valueNotEquals: "Food quality rating required!"
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (f) {
            var insertedResId;
            var reviewerName = $('#newResForm input[name="reviewerName"]').val();
            var restaurantName = $('#newResForm input[name="restaurantName"]').val();
            var restaurantType = $('#newResForm select[name="restaurantType"]').val();
            var restaurantService = $('#newResForm select[name="restaurantService"]').val();
            var restaurantClean = $('#newResForm select[name="restaurantClean"]').val();
            var foodQuality = $('#newResForm select[name="foodQuality"]').val();
            var visitTime = $('#newResForm input[name="visitTime"]').val();
            var visitDate = $('#newResForm input[name="visitDate"]').val();
            var price = $('#newResForm select[name="restaurantPrice"]').val();
            var note = $('textarea#rnote').val();
            var imageURI = $("#image").attr('src')

            db.transaction(function (tx) {
                tx.executeSql(`insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("${restaurantName}", "${restaurantType}", "${price}", "${restaurantService}", "${restaurantClean}","${foodQuality}", "${visitTime + " " + visitDate}", "${imageURI}")`, [], function (tx, rs) {
                    insertedResId = rs.insertId
                })
            }, errorCB, function () {
                db.transaction(function (tx) {
                    //if note exists, save it in the note table
                    if (note != "") {
                        tx.executeSql(`insert into notes(content, user_name, res_id) values ("${note}", "${reviewerName}", ${insertedResId})`)
                    }

                    //append new restaurant in the restaurant list
                    $("#restaurantList").append(
                        '<li data-theme="c">' +
                        `<a class="showResDetails" data-transition="slide" res-id=${insertedResId}>` +
                        `<img src=${imageURI}>` +
                        `<h2>${restaurantName}</h2>` +
                        '</a>' +
                        '</li>'
                    )
                    //refresh the restaurant list
                    $('#restaurantList').listview("refresh")

                    //add event to show detail button 
                    $(".showResDetails").on('click', function (e) {
                        let resId = $(this).attr('res-id')
                        $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${resId}` });
                    })

                    //clear all inputs and image
                    $('#newResForm input[name="reviewerName"]').val("");
                    $('#newResForm input[name="restaurantName"]').val("");
                    $('#newResForm input[name="visitTime"]').val("");
                    $('#newResForm input[name="visitDate"]').val("");
                    $('textarea#rnote').val("");
                    $("#image").attr("src", "img/default-image.png")

                    window.location.href = "#list"
                }, errorCB, successCB)
            })
            return false;
        }
    });

    $("#updateResForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            restaurantName: {
                required: true
            },
            visitTime: {
                required: true
            },
            visitDate: {
                required: true
            },
            restaurantPrice: {
                valueNotEquals: "default"
            },
            restaurantType: {
                valueNotEquals: "default"
            },
            restaurantService: {
                valueNotEquals: "default"
            },
            restaurantClean: {
                valueNotEquals: "default"
            },
            foodQuality: {
                valueNotEquals: "default"
            }
        },
        messages: {
            reviewerName: {
                required: "Your name required!",
            },
            restaurantName: {
                required: "Restaurant name required!",
            },
            visitTime: {
                required: "Visit time required!",
            },
            visitDate: {
                required: "Visit date required!",
            },
            restaurantPrice: {
                valueNotEquals: "Price is required!",
            },
            restaurantType: {
                valueNotEquals: "Type is required!"
            },
            restaurantService: {
                valueNotEquals: "Service rating is required!"
            },
            restaurantClean: {
                valueNotEquals: "Service rating is required!"
            },
            foodQuality: {
                valueNotEquals: "Service rating is required!"
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (f) {
            var restaurantName = $('#updateResForm input[name="restaurantName"]').val();
            var restaurantType = $('#updateResForm select[name="restaurantType"]').val();
            var restaurantService = $('#updateResForm select[name="restaurantService"]').val();
            var restaurantClean = $('#updateResForm select[name="restaurantClean"]').val();
            var foodQuality = $('#updateResForm select[name="foodQuality"]').val();
            var visitTime = $('#updateResForm input[name="visitTime"]').val();
            var visitDate = $('#updateResForm input[name="visitDate"]').val();
            var price = $('#updateResForm select[name="rprice"]').val();
            var res_id = $('#currentResId').val()

            db.transaction(function (tx) {
                tx.executeSql(`update restaurants set res_name="${restaurantName}", type="${restaurantType}", price="${price}", service="${restaurantService}", cleanliness="${restaurantClean}", quality="${foodQuality}", visited_time="${visitTime + " " + visitDate}" where res_id=${res_id}`, [], function (tx, rs) {
                    //clear all updateResForm inputs
                    $('#updateResForm input[name="reviewerName"]').val("");
                    $('#updateResForm input[name="restaurantName"]').val("");
                    $('#updateResForm input[name="visitTime"]').val("");
                    $('#updateResForm input[name="visitDate"]').val("");

                    //close updateResForm 
                    $("#updateResForm-close").trigger("click");

                    //update Restaurant Detail Screen
                    $('.infoResName').text(restaurantName)
                    $('.infoResType').text(restaurantType)
                    $('.infoResPrice').text(`${price}`)
                    $('.infoResRating').text(calcAverageRating(restaurantService, restaurantClean, foodQuality))
                    $('.infoResVisit').text(`${visitTime + " " + visitDate}`)

                    $("#restaurantList").empty();
                    db.transaction(renderAllRes, errorCB, successCB)
                })
            }, errorCB, successCB)
            return false;
        }
    });

});


