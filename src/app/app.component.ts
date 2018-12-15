import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.services.mozilla.com' },
  { urls: 'stun:stun.l.google.com:19302' }
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
  private serverConnection: WebSocket;
  private uuid;

  constructor(fb: FormBuilder) {
    this.textareas = fb.group({
      dataChannelSend: new FormControl({value: '', disabled: true}),
      dataChannelReceive: ['']
    });

    this.peerConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
  }

  ngOnInit(): void {
    this.dataChannelSend.nativeElement.placeholder = 'Press Start, enter some text, then press Send...';

    this.uuid = this.createUuid();

    this.serverConnection = new WebSocket(`ws://${window.location.hostname}:8080/ws/echo`);
    this.serverConnection.onmessage = this.getSocketMessageCallback();
    this.serverConnection.onopen = () => this.serverConnection.send(JSON.stringify({'ice': 1, 'uuid': this.uuid}));
  }

  private getSocketMessageCallback(): (string) => void {
    return (message) => {
      const signal = JSON.parse(message.data);
      console.log(`${this.uuid}: received ${signal}`);

      if (signal.uuid === this.uuid) {
        console.log(`${this.uuid}: self`);
        return;
      }
    };
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
