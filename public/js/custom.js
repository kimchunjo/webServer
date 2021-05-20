$(document).ready(function () {
    /* 초기 페이지 */
    getLocation();

    /* 장소 추가 페이지*/
    $('#sample6_address').on('propertychange change keyup paste input', function () {// 위도 경도 계산
        let address = $('#sample6_address').val();
        let detailAddress = $('#sample6_detailAddress').val();

        // 주소-좌표 변환 객체를 생성합니다
        var geocoder = new kakao.maps.services.Geocoder();
        // 주소로 좌표를 검색합니다
        geocoder.addressSearch(address + " " + detailAddress, function (result, status) {

            // 정상적으로 검색이 완료됐으면
            if (status === kakao.maps.services.Status.OK) {
                $('#latitude').val(result[0].y);
                $('#longitude').val(result[0].x);
            }
        });
    })

    $('#form_description').on('propertychange change keyup paste input', function () { // textarea 에서 태그 찾기
        let target = $('#form_description');
        checkTag(target);
    })

    changeTime();

    $(".open-time").on("propertychange change keyup paste input", function () {
        changeTime();
    });


    $(".amenities-check").change(function () {
        if ($(this).is(":checked")) {
            var checkedValue = $('#amenities').val();
            if (checkedValue == "")
                $('#amenities').val($(this).val());
            else
                $('#amenities').val(checkedValue + ", " + $(this).val());
        } else {
            if ($('#amenities').val() == $(this).val()) {
                $('#amenities').val("");
            }
            if ($('#amenities').val().indexOf($(this).val()) == 0) {
                var deletedValue = $('#amenities').val().replace($(this).val() + ", ", "");
                $('#amenities').val(deletedValue);
            } else {
                var deletedValue = $('#amenities').val().replace(", " + $(this).val(), "");
                $('#amenities').val(deletedValue);
            }

        }
    });


    $(".date-check").change(function () {
        checkRelease($(this));
        changeTime();
    });


    $('#buttonDate').on('click', function () {
        var date = ['월', '화', '수', '목', '금', '토', '일'];
        let newDate = "";
        var checkboxCount = $(".date-check").length;

        if (checkboxCount < 28) {
            for (var i = 0; i < 7; i++) {
                newDate += `
            <li class="list-inline-item">
                <div class="custom-control custom-checkbox">
                    <input class="custom-control-input date-check" type="checkbox" id="date_${checkboxCount + i}" name="date_${checkboxCount + i}" value="${date[i]}" checked="checked"/>
                        <label class="custom-control-label text-muted" for="date_${checkboxCount + i}">${date[i]}</label>
                </div>
            </li>   
        `;
            }

            $('#Date').append(`
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                    <label class="form-label" for="open_time_${checkboxCount / 7}">여는 시간</label>
                    <input class="form-control open-time" type="time" name="oTime_${checkboxCount / 7}" id="open_time_${checkboxCount / 7}" value="00:00" required="required"/>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                    <label class="form-label " for="open_time_${checkboxCount / 7}">닫는 시간</label>
                    <input class="form-control open-time" type="time" name="cTime_${checkboxCount / 7}" id="close_time_${checkboxCount / 7}" value="23:59" required="required"/>
                    </div>
                </div>
                <div class="col-md-12">
                    <div class="form-group">
                        <ul class="list-inline mb-0" id="DateList_${checkboxCount / 7}"></ul>
                    </div>
                </div>
            </div>
        `);

            $(`#DateList_${checkboxCount / 7}`).append(newDate);

            // 체크여부 확인
            for (var i = 0; i < checkboxCount; i++) {
                if ($(`input:checkbox[id=date_${i}]`).is(":checked") == true) {
                    $(`input:checkbox[id=date_${checkboxCount + (i % 7)}]`).prop('checked', false);
                }
            }
            $(".open-time").on("propertychange change keyup paste input", function () {
                changeTime();
            });
            $(".date-check").change(function () {
                checkRelease($(this));
                changeTime();
                if ($(this).is(":checked")) {
                    if ($(this).val() == '월') {
                        changeCheckbox(0, $(this));
                    } else if ($(this).val() == '화') {
                        changeCheckbox(1, $(this));
                    } else if ($(this).val() == '수') {
                        changeCheckbox(2, $(this));
                    } else if ($(this).val() == '목') {
                        changeCheckbox(3, $(this));
                    } else if ($(this).val() == '금') {
                        changeCheckbox(4, $(this));
                    } else if ($(this).val() == '토') {
                        changeCheckbox(5, $(this));
                    } else if ($(this).val() == '일') {
                        changeCheckbox(6, $(this));
                    }
                }
            });

        }
    });


    /* 장소 세부 페이지 */
    $('#review').on('propertychange change keyup paste input', function () {
        let target = $('#reviewSubmit');
        let target2 = $('#review');
        checkTag(target2);
        if ($('#review').val().trim() == "") {
            $(target).addClass('btn-muted').removeClass('btn-primary').attr('disabled', 'disabled');
        } else {
            $(target).removeClass('btn-muted').addClass('btn-primary').removeAttr('disabled');
        }
    })

    $('#review_search').on('change paste', function () {
        let target = $('#reviewModal').find('.review');
        let keyword = $('#review_search').val();
        for (let i = 0; i < target.length; i++) {
            let value = $(target[i]).find('p').text();
            if (value.indexOf(keyword) !== -1) {
                $(target[i]).addClass('d-block').addClass('d-sm-flex').fadeIn();
            } else if (keyword == "") {
                $(target[i]).addClass('d-block').addClass('d-sm-flex').fadeIn();
            } else {
                $(target[i]).removeClass('d-block').removeClass('d-sm-flex').fadeOut();
            }
        }
    })

    /* 장소 검색 결과 페이지 */
    $('#form_sort').on('change', function () {
        let selected = $(this).val();
        var searchWord = getParameterByName('search');
        var searchLocation = getParameterByName('location');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    window.location.href = `/category?search=${searchWord}&location=${searchLocation}&sort=${selected}&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
                }
            )
        }else{
            window.location.href = `/category?search=${searchWord}&location=${searchLocation}&sort=${selected}`
        }
    });

    $('#form_sort_map').on('change', function () {
        let selected = $(this).val();
        var searchWord = getParameterByName('search');
        var searchLocation = getParameterByName('location');
        if (selected == "Closest") {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        window.location.href = `/category-map?search=${searchWord}&location=${searchLocation}&sort=${selected}&lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
                    }
                )
            }
        } else {
            window.location.href = `/category-map?search=${searchWord}&location=${searchLocation}&sort=${selected}`;
        }
    });
})

function getLocation() {
    if (navigator.geolocation) { // GPS를 지원하면
        navigator.geolocation.getCurrentPosition(function (position) {
            $('.index_latitude').val(`${position.coords.latitude}`);
            $('.index_longitude').val(`${position.coords.longitude}`);
        }, function (error) {
            console.error(error);
        }, {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: Infinity
        });
    } else {
        // 위치 지원 x
    }
}


function checkRelease(checkbox) {
    if (!checkbox.is(":checked")) {
        if (checkbox.val() == "월") {
            $('#openMon').val("0");
            $('#closeMon').val("0");
        } else if (checkbox.val() == "화") {
            $('#openTue').val("0");
            $('#closeTue').val("0");
        } else if (checkbox.val() == "수") {
            $('#openWed').val("0");
            $('#closeWed').val("0");
        } else if (checkbox.val() == "목") {
            $('#openThu').val("0");
            $('#closeThu').val("0");
        } else if (checkbox.val() == "금") {
            $('#openFri').val("0");
            $('#closeFri').val("0");
        } else if (checkbox.val() == "토") {
            $('#openSat').val("0");
            $('#closeSat').val("0");
        } else if (checkbox.val() == "일") {
            $('#openSun').val("0");
            $('#closeSun').val("0");
        }
    }
}

function changeTime() {
    var checkboxLength = $(".date-check").length;
    for (var i = 0; i < checkboxLength; i++) {
        if ($(`input:checkbox[id=date_${i}]`).is(":checked") == true) {
            if (i % 7 == 0) {
                $('#openMon').val($(`#open_time_${parseInt(i / 7)}`).val());
                $('#closeMon').val($(`#close_time_${parseInt(i / 7)}`).val());
            } else if (i % 7 == 1) {
                $('#openTue').val($(`#open_time_${parseInt(i / 7)}`).val());
                $('#closeTue').val($(`#close_time_${parseInt(i / 7)}`).val());
            } else if (i % 7 == 2) {
                $('#openWed').val($(`#open_time_${parseInt(i / 7)}`).val());
                $('#closeWed').val($(`#close_time_${parseInt(i / 7)}`).val());
            } else if (i % 7 == 3) {
                $('#openThu').val($(`#open_time_${parseInt(i / 7)}`).val());
                $('#closeThu').val($(`#close_time_${parseInt(i / 7)}`).val());
            } else if (i % 7 == 4) {
                $('#openFri').val($(`#open_time_${parseInt(i / 7)}`).val());
                $('#closeFri').val($(`#close_time_${parseInt(i / 7)}`).val());
            } else if (i % 7 == 5) {
                $('#openSat').val($(`#open_time_${parseInt(i / 7)}`).val());
                $('#closeSat').val($(`#close_time_${parseInt(i / 7)}`).val());
            } else if (i % 7 == 6) {
                $('#openSun').val($(`#open_time_${parseInt(i / 7)}`).val());
                $('#closeSun').val($(`#close_time_${parseInt(i / 7)}`).val());
            }
        }
    }
}


function changeCheckbox(dateIndex, box) {
    var checkboxLength = $(".date-check").length;
    for (var i = dateIndex; i < checkboxLength;) {
        $(`input:checkbox[id=date_${i}]`).prop('checked', false);
        i += 7;
    }
    box.prop('checked', true);
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}


/* signup page */
function checkPassword() {
    let password = $('#loginPassword').val();
    let password2 = $('#loginPassword2').val();
    if (password === password2 && password !== "") {
        let submitBtn = $('#signupSubmit').removeClass('btn-muted').addClass('btn-primary').removeAttr('disabled')
    } else {
        let notice = `<p class="text-secondary text-sm">비밀번호가 일치하지 않습니다.</p>`;
        let submitBtn = $('#signupSubmit').addClass('btn-muted').removeClass('btn-primary').attr('disabled', 'disabled');
    }
}

/* user-add-1 page */
function checkTag(self) {
    let text = $(self).val();
    let textArray = text.split(" ");
    let tagArray = new Array();

    for (let i = 0; i < textArray.length; i++) {
        let temp = "";
        let tag = false;
        for (let j = 0; j < textArray[i].length; j++) {
            if (tag === true) {
                temp += textArray[i][j];
            }
            if (textArray[i][j] == "#") {
                tag = true
            }
        }
        tagArray[i] = temp;
    }


    /* 새롭게 추가된 태그를 넣는다. */
    for (let i = 0; i < tagArray.length; i++) {
        if (tagArray[i] !== "") {
            let tag = tagArray[i]
            let tagBox = $('#description_tag_box');
            let alreadyExistsTag = false;

            for (let j = 0; j < tagBox.children().length; j++) {
                if (tag == tagBox.children().eq(j).text()) {
                    console.log("이미존재" + tagBox.children().eq(j).text())
                    alreadyExistsTag = true;
                    break;
                }
            }

            if (alreadyExistsTag === false) {

                let html = `<span class="badge badge-secondary" style="margin-right: 3px">${tag}</span>`;
                tagBox.append(html);
            }
        }
    }

    /* 변경되거나 삭제된 태그를 처리한다. */
    let tagBox = $('#description_tag_box');
    for (let i = 0; i < tagBox.children().length; i++) {
        let tag = tagBox.children().eq(i).text();
        let temp = false;
        for (let j = 0; j < tagArray.length; j++) {
            if (tag == tagArray[j]) {
                temp = true;
                break;
            }
        }
        if (temp === false) {
            tagBox.children().eq(i).remove();
        }
    }
    let temp = "";
    for (let i = 0; i < tagBox.children().length; i++) {
        temp = temp + tagBox.children().eq(i).text() + " ";
        $('#hide_tag_box').text(temp);
    }
}


function sample6_execDaumPostcode() {
    new daum.Postcode({
        oncomplete: function (data) {
            // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

            // 각 주소의 노출 규칙에 따라 주소를 조합한다.
            // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
            var addr = ''; // 주소 변수
            var extraAddr = ''; // 참고항목 변수

            //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
            if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                addr = data.roadAddress;
            } else { // 사용자가 지번 주소를 선택했을 경우(J)
                addr = data.jibunAddress;
            }

            // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
            if (data.userSelectedType === 'R') {
                // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                    extraAddr += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가한다.
                if (data.buildingName !== '' && data.apartment === 'Y') {
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                if (extraAddr !== '') {
                    extraAddr = ' (' + extraAddr + ')';
                }
                // 조합된 참고항목을 해당 필드에 넣는다.
                document.getElementById("sample6_extraAddress").value = extraAddr;

            } else {
                document.getElementById("sample6_extraAddress").value = '';
            }

            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            document.getElementById('sample6_postcode').value = data.zonecode;
            document.getElementById("sample6_address").value = addr;
            // 커서를 상세주소 필드로 이동한다.
            document.getElementById("sample6_detailAddress").focus();

            if ($('#sample6_address').is('input:text') && arguments.length >= 1) {
                // this is input type=text setter
                $('#sample6_address').trigger("input");
            }
        }
    }).open();
}

function writeReview(self) {
    let today = new Date();
    let month = today.getMonth() + 1
    let hours = today.getHours();
    let year = today.getFullYear();
    year = (String(year)).substr(2, String(year).length)
    if (hours >= 12)
        hours = "오후 " + (parseInt(hours) - 12);
    else
        hours = "오전 " + parseInt(hours);
    let date = year + ". " + month + ". " + today.getDate() + ". " + hours + ":" + today.getMinutes();

    let data = {
        placeNumber: $('#placeNumber').val(),
        rating: $('#rating').val(),
        writer: $('#writer').val(),
        review: $('#review').val(),
        tag: $('#hide_tag_box').val()
    };

    let dataInfo = {
        method: "post", //메소드 반드시 지정해줘야 app.js 파일에서 찾을수 있음.
        body: JSON.stringify(data), //JSON 형태로 변환
        headers: {
            "Content-Type": "application/json" // 타입 반드시 지정해줘야함..
        }
    };

    fetch('/review', dataInfo)
        .then(res => res.json())
        .then(result => {
            let rating = "";
            for (let i = 0; i < data.rating; i++) {
                rating += `<i class="fa fa-xs fa-star text-primary"></i>`;
            }
            for (let i = data.rating; i < 5; i++) {
                rating += `<i class="fa fa-xs fa-star text-gray-200"></i>`
            }
            let new_review = `
                <div class="media d-block d-sm-flex review review-in-detail">
                    <div class="text-md-center mr-2 mr-xl-4">
                        <img class="d-block avatar avatar-lg p-1 mb-2" src="img/avatar/avatar-8.jpg" alt="aa@11">
                        <span class="text-uppercase text-muted text-sm">${date}</span>
                    </div>
                    <div class="media-body">
                        <h6 class="mt-2 mb-1">${data.writer}</h6>
                        <div class="mb-2">
                            ${rating}
                        </div>
                        <p class="text-muted text-sm">${data.review}</p>
                    </div>
                </div>
            `;
            let review = $('.review-in-detail').last();
            if (review.length !== 0) {
                $(review).after(new_review)
            } else {
                review = $('.text-block').last().children('h5').after(new_review);
            }
        })
    $('#review').val('');
    //$('#hide_tag_box').val('');
    $('#description_tag_box').empty();
    $('#reviewSubmit').addClass('btn-muted').removeClass('btn-primary').attr('disabled', 'disabled');
}
