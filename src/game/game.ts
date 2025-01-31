import { Stoppable, Time } from '../common';
import { Event } from '../events';
import { Scene } from './scene';

export class Game implements Stoppable {
  public time: Time;
  public onWindowResize: Event;

  private _scenes: Set<Scene>;

  constructor() {
    this.time = new Time();
    this._scenes = new Set<Scene>();
    this.onWindowResize = new Event('window-resize');

    window.addEventListener('resize', () => {
      this.onWindowResize.raise();
    });
  }

  public run = async (time = 0) => {
    this.time.update(time);

    const scenePromises: Promise<void>[] = [];

    for (const scene of this._scenes) {
      scenePromises.push(scene.update(this.time));
    }

    await Promise.all(scenePromises);

    requestAnimationFrame(this.run);
  };

  public registerScene = (scene: Scene) => {
    this._scenes.add(scene);
  };

  public deregisterScene = (scene: Scene) => {
    this._scenes.delete(scene);
  };

  public stop = () => {
    window.removeEventListener('resize', this.onWindowResize.raise);

    for (const scene of this._scenes) {
      scene.stop();
    }
  };
}
