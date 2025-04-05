// Server Configuration
const SERVER_URL = window.location.protocol + '//' + window.location.hostname + ':1337';
const SENDER_URL = window.location.protocol + '//' + window.location.hostname + ':1338';
const POLL_INTERVAL = 1000; // ms

// Our computer location in Russia (Moscow)
const OUR_COMPUTER = {
    latitude: 55.7558,
    longitude: 37.6173,
    name: "The Server (Moscow, Russia)"
};

// Global variables
let scene, camera, renderer, controls;
let earthMesh, earthGroup;
let packetsData = [];
let isPolling = false;
let packetsPerSecond = [];
let packetsChart;
let lastPacketCount = 0;
let packetObjects = [];
