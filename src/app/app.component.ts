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

  private serverConnection;
  private localConnection;
  private remoteConnection;

  constructor(fb: FormBuilder) {
    this.textareas = fb.group({
      dataChannelSend: new FormControl({value: '', disabled: true}),
      dataChannelReceive: ['']
    });
  }

  ngOnInit(): void {
    this.dataChannelSend.nativeElement.placeholder = 'Press Start, enter some text, then press Send...';
    this.setupWebRtc();
  }

  setupWebRtc() {
    this.serverConnection = new RTCPeerConnection(PEER_CONNECTION_CONFIG);
    console.log('Created local peer connection object localConnection');

    this.serverConnection.onicecandidate = this.gotIceCandidate;
    this.serverConnection.onaddstream = this.gotRemoteStream;
  }

  private gotIceCandidate(event) {
    if (event.candidate != null) {
      this.serverConnection.send(JSON.stringify({ 'ice': event.candidate }));
    }
  }

  private gotRemoteStream(event) {
    console.log('got remote stream');
  }

  private getOtherPc(pc) {
    return (pc === this.localConnection) ? this.remoteConnection : this.localConnection;
  }
}
