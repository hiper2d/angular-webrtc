import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';

const ICE_SERVERS: RTCIceServer[] = [
  {urls: 'stun:stun.services.mozilla.com'},
  {urls: 'stun:stun.l.google.com:19302'}
];

const PEER_CONNECTION_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('dataChannelSend') dataChannelSend: ElementRef;

  textareas: FormGroup;

  private peerConnection: RTCPeerConnection;
  private signalingConnection: WebSocket;
  private uuid;

  constructor(fb: FormBuilder) {
    this.textareas = fb.group({
      dataChannelSend: new FormControl({value: '', disabled: true}),
      dataChannelReceive: ['']
    });
  }

  ngOnInit(): void {
    this.dataChannelSend.nativeElement.placeholder = 'Press Start, enter some text, then press Send...';
    this.uuid = this.createUuid();
    this.setupSignalingServer();
    this.setupPeerServer();
  }

  start() {
    this.peerConnection
      .createOffer()
      .then(this.createdDescription())
      .catch(this.errorHandler);
  }

  private setupSignalingServer() {
    this.signalingConnection = new WebSocket(`ws://${window.location.hostname}:8080/ws/echo`);
    this.signalingConnection.onmessage = this.getSocketMessageCallback();
  }

  private setupPeerServer() {
    this.peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
    this.peerConnection.onicecandidate = this.getIceCandidateCallback();
  }

  private getSocketMessageCallback(): (string) => void {
    return (message) => {
      const signal = JSON.parse(message.data);
      console.log(`${this.uuid}: received ${signal}`);

      if (signal.uuid === this.uuid) {
        console.log(`${this.uuid}: self`);
        return;
      }

      if (signal.sdp) {
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          // Only create answers in response to offers
          if (signal.sdp.type === 'offer') {
            this.peerConnection.createAnswer().then(this.createdDescription()).catch(this.errorHandler);
          }
        }).catch(this.errorHandler);
      } else if (signal.ice) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(this.errorHandler);
      }
    };
  }

  private getIceCandidateCallback(): (string) => void {
    return (event) => {
      console.log('got ice');

      if (event.candidate != null) {
        this.signalingConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': this.uuid }));
      }
    };
  }

  private createdDescription(): (string) => void {
    return (description) => {
      console.log('got description');

      this.peerConnection.setLocalDescription(description).then(() => {
        this.signalingConnection.send(JSON.stringify({ 'sdp': this.peerConnection.localDescription, 'uuid': this.uuid }));
      }).catch(this.errorHandler);
    };
  }

  private errorHandler(error) {
    console.log(error);
  }

  // Taken from http://stackoverflow.com/a/105074/515584
  // Strictly speaking, it's not a real UUID, but it gets the job done here
  private createUuid(): string {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }
}
