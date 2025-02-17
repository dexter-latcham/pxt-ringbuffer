//% color="#EB32D5" weight=100
namespace ringbuffer {
    let buffers: Buffer[] = [];
    let maxBufferContent = 2;
    let bufferCount = 3;
    let maxElements = maxBufferContent * bufferCount;
    let start = 0;
    let size = 0;

    // Create a new ring buffer and initialize the buffers
    //% block="create new ring buffer"
    export function createNewRingBuffer(): void {
        buffers = [];
        for (let i = 0; i < bufferCount; i++) {
            buffers.push(pins.createBuffer(maxBufferContent * 2));
        }
        start = 0;
        size = 0;
    }

    // Append a new value to the ring buffer
    //% block="append $value to ring buffer"
    export function append(value: number): void {
        let index = (start + size) % maxElements;
        let arrayToInsert = Math.floor(index / maxBufferContent);
        let arrayIndex = index - (arrayToInsert * maxBufferContent);

        if (size < maxElements) {
            buffers[arrayToInsert].setNumber(NumberFormat.Int16LE, arrayIndex * 2, value);
            size++;
        } else {
            arrayToInsert = Math.floor(start / maxBufferContent);
            arrayIndex = start - (arrayToInsert * maxBufferContent);
            buffers[arrayToInsert].setNumber(NumberFormat.Int16LE, arrayIndex * 2, value);
            start = (start + 1) % maxElements;
        }
    }

    //get a value from the buffer at index
    //% block="get item at index $index from ring buffer"
    export function getItem(index: number): number {
        if (index < 0 || index >= size) {
            return 0;
        }
        let wholeIndex = (start + index) % maxElements;
        let arrayToInsert = Math.floor(wholeIndex / maxBufferContent);
        let arrayIndex = wholeIndex - (arrayToInsert * maxBufferContent);
        return buffers[arrayToInsert].getNumber(NumberFormat.Int16LE, arrayIndex * 2);
    }
    export function getMaxElements(): number{
        return maxElements;
    }
}
