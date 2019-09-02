# AsciiSvg3

AsciiSvg3 is the unofficial third version of the ASCIIsvg project, whicha is a JavaScript interface
for generating [https://www.w3.org/TR/SVG2/](SVG) graphics in a more user-friendly way.

## Versions of ASCIIsvg

  * The original ASCIIsvg "v1" was released in 2009 by [Peter Chapman][1] under the GPLv1.
  * The second ASCIIsvg "v2", named "ASCIIsvg-IM" was released in 2016 by [Murray Bourne][2] under the GPLv2.
  * The third AsciiSvg v3, named "ASCIIsvg3" was released in 2019 by [Westley Trevino][3] under the GPLv2.

[1]: http://www1.chapman.edu/~jipsen/
[2]: https://www.intmath.com/cg3/asciisvg-im-js-demo.php
[3]: https://www.trevino.pw/

## Design Goals

In the modern web, far more powerful tools now exist for graphing visualizations. AsciiSvg3 will be
updated to more modern JavaScript sensibilities with an eye toward simple, mostly static figures
that are easy to describe.

Also, it is important to ensure the SVG methods used comply with the latest published [SVG 1.1
(Second Edition)][4] standard, with an eye toward newer draft standards like [SVG 2.0][5]. Basic
animation was possible with older ASCIIsvg versions, and an interface for this animation is a
non-critical goal. If possible, a compatibility layer will be added so that AsciiSvg3 is a drop-in
replacement for older ASCIIsvg versions.

[4]: http://www.w3.org/TR/2011/REC-SVG11-20110816/
[5]: https://svgwg.org/svg2-draft/
