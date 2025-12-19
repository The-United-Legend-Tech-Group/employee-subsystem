import { Mail, Linkedin, Twitter } from "lucide-react"

export function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-card border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter">
              GET IN
              <br />
              <span className="text-muted-foreground">TOUCH</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Ready to revolutionize your HR department? Let's discuss how NEXUSHR can transform your workforce
              management.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <a
                  href="mailto:hello@nexushr.com"
                  className="text-foreground hover:text-muted-foreground transition-colors"
                >
                  hello@nexushr.com
                </a>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold mb-4 tracking-wide">PRODUCT</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Integrations
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Changelog
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-4 tracking-wide">COMPANY</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-4 tracking-wide">RESOURCES</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Community
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Status
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold mb-4 tracking-wide">LEGAL</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-foreground transition-colors">
                      Security
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © 2025 Arcana. All rights reserved.
        </div>
      </div>
    </section>
  )
}
