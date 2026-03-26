import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';

interface Iprops {
  className?: string;
  iconClass?: string;
  dialogClass?: string;
  classOverlay?: string;
  children: any;
  show: any;
  hide: any;
  title?: any;
  titleClass?: any;
  childClass?: any;
  closeModal?: any;
}

export default function Modal({
  show,
  hide,
  children,
  className,
  classOverlay,
  childClass,
  iconClass,
  dialogClass,
}: Iprops) {
  return (
    <Transition show={show} as={Fragment}>
      <Dialog as="div" className={`${dialogClass} fixed z-[500000000] inset-0`} onClose={hide}>
        <div className="flex items-center justify-center px-4 pb-20 h-screem text-center sm:block md:p-0">
          {/* Add the `show` prop to this `Transition` */}
          <Transition show={show}>
            <div
              onClick={() => {
                hide(false);
              }}
              className={`${classOverlay} fixed inset-0 bg-black bg-opacity-60 transition-opacity`}
            ></div>
          </Transition>
          <span className="inline-block align-middle h-screen" aria-hidden="true">
            &#8203;
          </span>
          <div
            className={`${className} w-full sm:w-7/12 lg:w-10/12 inline-block align-top bg-white
            rounded-3xl p-7 text-left overflow-hidden 
             sm:align-middle relative border border-gray-400 md:max-h-[calc(100vh-20px)] max-h-[calc(100vh-60px)] hideScrollbar overflow-y-auto atScrollHide`}
          >
            <div
              className={`${iconClass} text-right absolute right-4 top-4 cursor-pointer z-20`}
              onClick={() => {
                hide(false);
              }}
            >
              <button
                type="button"
                className=" text-gray-400  text-4xl hover:text-black-100 focus:outline-none "
              >
                <span className="sr-only">Close</span>
                {/* <Cross /> */}
                <AiOutlineCloseCircle className="text-3xl" />
              </button>
            </div>
            <div className={`${childClass} mt-5`}>{children}</div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
