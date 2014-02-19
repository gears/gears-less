gears-less
==========

LESS_ compiler for Gears_. This package already includes the LESS source
code for you, so you don't need to worry about installing it yourself.

Bundled LESS version: **1.6.3**

Installation
------------

Install ``gears-less`` with pip::

    $ pip install gears-less


Requirements
------------

``gears-less`` requires node.js_ to be installed in your system.


Usage
-----

Add ``gears_less.LESSCompiler`` to ``environment``'s compilers registry::

    from gears_less import LESSCompiler
    environment.compilers.register('.less', LESSCompiler.as_handler())

If you use Gears in your Django project, add this code to its settings::

    GEARS_COMPILERS = {
        '.less': 'gears_less.LESSCompiler',
    }

.. _LESS: http://lesscss.org/
.. _Gears: https://github.com/gears/gears
.. _node.js: http://nodejs.org/
