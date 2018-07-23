import { Pipe, Updater, Lens } from "../internal";

// TODO: create interface?
export class Recorder<T> extends Pipe implements Lens<T> {
    private readonly recordedUpdates: Updater<T>[] = []
    private recording = true

    update(updater: Updater<T>) {
        if (this.recording)
            this.recordedUpdates.push(updater)
        return super.update(updater)
    }

    pause() {
        this.recording = false
    }

    resume() {
        this.recording = true
    }

    reset() {
        this.recordedUpdates.splice(0)
    }

    /**
     * Replays the recorded update onto the target
     * This process is atomic; if one of the updaters throws an exception,
     * the target will be unmodified
     */
    replay(target: Lens<T>) {
        target.update(draft => {
            this.recordedUpdates.forEach(u => {
                // TODO: normalise u
                u(draft)
            })
        })
    }

    getCacheKey() {
        return undefined; // no caching!
    }

    describe() {
        return this.base.describe() + ".recorder()"
    }
}
