import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'thanks-for-request',
  styleUrls: ['thanks-for-request.component.scss'],
  templateUrl: 'thanks-for-request.component.html'
})
export class ThanksForRequestComponent implements OnInit {

  @Output() buttonClick = new EventEmitter<void>();

  ngOnInit(): void {
  }
}
