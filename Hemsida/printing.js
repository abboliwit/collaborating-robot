
var ConnectBtn = document.getElementById('Robot');// alla document.getElementById varriabler behövs inte men det var enklare att ha dem som små variabler än den långa satsen
var Status = document.getElementById('status');// de små variablerna gör också koden enklare att förstå
var StartBtn = document.getElementById('Start');
var send = document.getElementById("Send")
var log = document.getElementById("message");
var oliver = document.getElementById("item2")
var simon = document.getElementById("item")
var Values = [document.getElementById("1"), document.getElementById("2"),document.getElementById("3"),document.getElementById("4"),document.getElementById("5"),document.getElementById("6"),document.getElementById("7"),document.getElementById("9")]; //,document.getElementById("10"),document.getElementById("8")
var time = 0; time_oliver =0;
var charts =['O','S'];

window.onload = function(){//denna funktion körs när sidan laddas in 
    startConnect();// kopplar instant upp till mqtt brokern
    var param = JSON.parse(window.localStorage.getItem('param'));
    if(param != null){//ladar in de sparade värderna om filen inte är tom
        Values[0].value = param["Interval"]
        Values[1].value = param["Integration"]
        Values[2].value = param["Proportionell"]
        Values[3].value = param["Derivative"]
        Values[4].value = param["PubFrequency"]
        Values[5].value = param["RequestedRPM"]
        Values[6].value = param["Dist"]
        Values[7].value = param["Task"]
    }
    for(var pos =0;pos<2;pos++){//skapar två nya grafer i arrayen charts
    var ctx = document.getElementById(charts[pos]+'Chart');
    charts[pos] = new Chart(ctx, {// Chart.js  libraiet används för att enklare visa grafer
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Rpm',
            data: [],
            backgroundColor: [
                'rgba(0, 255, 255, 0.4)'
            ],
            borderColor: [
                'rgba(0, 255, 255, 1)'
            ],
            borderWidth: 1
        }
        ,{label: 'RequestedRPM',
        data: [],
        backgroundColor: [
            'rgba(0, 102, 255, 0.4)'
        ],
        borderColor: [
            'rgba(0, 102, 255, 1)'
        ],
        borderWidth: 1,
        fill:false}]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }
});}
}
send.onclick = function(e){
    e.preventDefault();
    if(Values[7].value == "S"){//om tasken är stopp så ställs graferna om
        time=0;
        clear_graph()
    }if(Values[7].value == "Shrek"){new Audio('./node_modules/shrek.wav').play()}//Easter egg skriv Shrek som task för att se vad den gör ;)
    data ={"V":["A",Values[7].value,Values[0].value,Values[1].value,Values[2].value,Values[3].value,Values[4].value,Values[5].value,Values[6].value]}
    pub(data)// skickar värderna till robotarna data är svår läst då vi behövde 
}
document.getElementById("Save").onclick = function(e){
    if(Values[0].value != ""){//tar in värderna från hemsidan
        data ={ 
            "Owner": "All",
            "Interval" :Values[0].value,
            "Integration" : Values[1].value,
            "Proportionell" : Values[2].value,
            "Derivative" : Values[3].value,
            "PubFrequency" : Values[4].value,
            "RequestedRPM" : Values[5].value,
            "Dist": Values[6].value,
            "Task": Values[7].value,
        }
    console.log("Saved")
    window.localStorage.setItem('param', JSON.stringify(data));//sparar värderna på den locala datorn som använder sidan
    }
}
ConnectBtn.onclick = function(e){//conect knappen finns för att kunna korrigera fel
    e.preventDefault();
    if(ConnectBtn.innerHTML== "Connect Client"){
        startConnect();}
    else{
        startDisconnect();}
    return false;
};

function clear_graph(){// en funktion som rensar graferna
    for(var x=0;x<1;x++){
        charts[x].data.labels=[0]
        charts[x].data.datasets.forEach(function(value,index,array){value.data=[];console.log(value)});//itererar all data till graferna och återställer dem
        charts[x].update()
    }
}
function startConnect() {//kopplar upp websidan till mqtt
    clientID = "clientID_" + parseInt(Math.random() * 100);//variabler för att logga in
    host = 'maqiatto.com';
    port = 8883;
    client = new Paho.MQTT.Client(host, Number(port), clientID);
    client.onConnectionlost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({userName : "oliver.witzelhelmin@abbindustrigymnasium.se",password : "vroom",
        onSuccess: onConnect,//referarar till olika funktioner beroende på de olika fallen som kan uppstå
        onFailure: onFail,
    });
}
function startDisconnect(){//kopplar ned från mqtt
    ConnectBtn.innerHTML= "Connect Client";
    Status.innerHTML = "Disconnected";
    message = new Paho.MQTT.Message(JSON.stringify(clientID));
    message.destinationName = "offline";
    client.send(message);//skickar ett sista medelande
    client.disconnect();
    console.log("disconnected")
}
function pub(dataobjekt){//skickar medelande
    message = new Paho.MQTT.Message(JSON.stringify(dataobjekt));
    message.destinationName = "oliver.witzelhelmin@abbindustrigymnasium.se/vroom_vroomO";// ger medelandet en destination
    if (Status.innerHTML =="Connected"){// om websidan är kopplad med mqtt skckas medelandet
    console.log(message)
    client.send(message);//skickar iväg medelandet till ena roboten
    message = new Paho.MQTT.Message(JSON.stringify(dataobjekt));
    message.destinationName = "oliver.witzelhelmin@abbindustrigymnasium.se/vroom_vroomS";
    client.send(message)// skickar iväg till den andra
    // robotarna delades upp till två topics då det inte fungerade att ha dem på samma
    }else{
        log.value = "Can't publish while disconnected \n"
    }}
function onFail() {// när det inte går att koppla upp så skrivs error medelande upp
    ConnectBtn.innerHTML= "Connect Client";
    Status.innerHTML = "Disconnected";
    console.log('<span>ERROR: Connection to: ' + host + ' on port: ' + port + ' failed.</span><br/>');// indikerar om man inte kan connecta
    log.value = "Eroor could not establish a connection to the broker"}

function onConnectionLost(responseObject){// när upkopplingen bryts så skrivs fel medelande
    ConnectBtn.innerHTML= "Connect Client";
    Status.innerHTML = "Disconnected";
    console.log('<span>ERROR: ' + host + ' on port: ' + port + ' has been shut down.</span><br/>');
    log.value = "unnexpected broker failure"
    if (responseObject.errorCode !== 0) {
        Status.innerHTML += '<span>ERROR: ' + + responseObject.errorMessage + '</span><br/>';
    }}  

function onConnect() {//subar till roboternas topics och skickar ett hello world
    ConnectBtn.innerHTML= "Disconnect Client";
    Status.innerHTML="Connected";
    topic = 'oliver.witzelhelmin@abbindustrigymnasium.se/broom_broomS';
    console.log('<span>Subscribing to: ' + topic + '</span><br/>');
    client.subscribe(topic);
    client.subscribe("oliver.witzelhelmin@abbindustrigymnasium.se/broom_broomO")// Olivers robot
    message = new Paho.MQTT.Message("Hello World 2");
    message.destinationName = "oliver.witzelhelmin@abbindustrigymnasium.se/broom_broomS";// Simons robot
    client.send(message);
    log.value = "Succsesfully conected to broker \n"
}
function onMessageArrived(message) {// hanterar inkommande medelande
    var context = message.payloadString;
    console.log(message.destinationName)
    if(message.destinationName == "oliver.witzelhelmin@abbindustrigymnasium.se/broom_broomO"){// kollar vems robot det är
        if(context[0]=="{"){// kollar att det är en JSON fil             
            var json = JSON.parse(context);//parse:ar filen
            console.log(json);
            line = "RPM:    "+json["O"][0]+" Proportionell:    "+json["O"][1]+" Integration:    "+json["O"][2]+" Derivering:    "+json["O"][3]+" Time:    "+json["O"][4];
            // filen är komprimerad för att spara utryme således blir den svår läst
            oliver.value += line+"\n";// skriver de nya värderna
            if(time_oliver ==0){time_oliver = json["O"][4]}// skapar en start tid
            charts[0].data.labels.push(json["O"][4]-time_oliver);// sätter in robotens nya värden i grafen
            charts[0].data.datasets[0].data.push(json["O"][0])// rpm värdet
            charts[0].data.datasets[1].data.push(Values[5].value)// bör
            charts[0].update()
            return
        }else{oliver.value+=context+"\n"}//om det inte är en JSON fil så är det bara ett vanligt medelande
    }
    if(message.destinationName = "oliver.witzelhelmin@abbindustrigymnasium.se/broom_broomS"){// samma som ovan fast för simons robot
        if(context[0]=="{"){            
            var json = JSON.parse(context);
            console.log(json);
            line = "RPM:    "+json["S"][0]+" Proportionell:    "+json["S"][1]+" Integration:    "+json["S"][2]+" Derivering:    "+json["S"][3]+" Time:    "+json["S"][4];
            simon.value += line+"\n";  
            if(time ==0){time = json["S"][4]}
            charts[1].data.datasets[0].data.push(json["S"][0])
            charts[1].data.datasets[1].data.push(Values[5].value)
            charts[1].data.labels.push(json["S"][4]-time);
            charts[1].update()
        }else{simon.value+=context+"\n"}}
    console.log("message arrived:"+context)// skriver ut medelandet för enklare felsökning
    }