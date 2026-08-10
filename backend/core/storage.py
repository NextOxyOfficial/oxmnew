"""Static files storage that a third-party template cannot take down.

WhiteNoise's manifest storage rewrites every {% static %} path to its hashed
name and raises ValueError when a path is not in the manifest. That is the
right default for our own templates — a typo should be loud.

It is the wrong outcome for paths we do not control. Jazzmin's admin/base.html
contains

    data-theme-base="{% static 'vendor/bootswatch' %}"

which asks for a *directory*. A manifest only ever lists files, so the lookup
raises and the entire admin returns 500 — for a hint its JavaScript uses to
build bootswatch theme URLs, on a site whose theme is "default" and never
switches. Losing the admin over that is not a trade worth making.

So a miss falls back to the plain path (still served correctly by the /static/
location) and is logged, which keeps a genuinely missing asset visible as a
warning and a 404 rather than hiding it completely.
"""

import logging

from whitenoise.storage import CompressedManifestStaticFilesStorage

logger = logging.getLogger(__name__)


class ForgivingManifestStaticFilesStorage(CompressedManifestStaticFilesStorage):
    def stored_name(self, name):
        try:
            return super().stored_name(name)
        except ValueError:
            # Logged once per distinct path per process — enough to notice a
            # real missing asset without flooding the log on every request.
            if name not in self._missing_reported:
                self._missing_reported.add(name)
                logger.warning(
                    "Static path %r is not in the manifest; serving it unhashed. "
                    "If this is one of our own files, it was not collected.",
                    name,
                )
            return name

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._missing_reported = set()
